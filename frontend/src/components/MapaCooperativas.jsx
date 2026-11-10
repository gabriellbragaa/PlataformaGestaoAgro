import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import api from "../services/api";

// Corrige o ícone padrão do Leaflet, que quebra com o Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const CACHE_KEY = "geo_cache_v1";
const CENTRO_PADRAO = [-5.2, -39.3]; // Ceará
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function lerCache() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
        return {};
    }
}

function salvarCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        /* sem espaço ou bloqueado: segue sem cache */
    }
}

async function geocodificar(consulta) {
    const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1" +
        `&countrycodes=br&q=${encodeURIComponent(consulta)}`;

    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    if (!resp.ok) throw new Error("Falha na geocodificação.");

    const dados = await resp.json();
    return dados[0]
        ? { lat: Number(dados[0].lat), lng: Number(dados[0].lon) }
        : null;
}

// Tenta o endereço completo; se falhar, usa só cidade e estado
function candidatas(c) {
    const lista = [];
    if (c.endereco && c.cidade) {
        lista.push(
            [c.endereco, c.bairro, c.cidade, c.estado, "Brasil"]
                .filter(Boolean)
                .join(", ")
        );
    }
    lista.push([c.cidade, c.estado, "Brasil"].filter(Boolean).join(", "));
    return lista;
}

// Enquadra o mapa para mostrar todos os marcadores
function AjustarVista({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (pontos.length === 0) return;
        if (pontos.length === 1) {
            map.setView([pontos[0].lat, pontos[0].lng], 12);
            return;
        }
        map.fitBounds(
            L.latLngBounds(pontos.map((p) => [p.lat, p.lng])),
            { padding: [40, 40], maxZoom: 12 }
        );
    }, [pontos, map]);

    return null;
}

export default function MapaCooperativas() {
    const [pontos, setPontos] = useState([]);
    const [total, setTotal] = useState(0);
    const [processadas, setProcessadas] = useState(0);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        let cancelado = false;

        async function carregar() {
            try {
                const { data: lista } = await api.get("/cooperativa/cooperativas-mapa");
                if (cancelado) return;

                setTotal(lista.length);

                const cache = lerCache();
                const encontrados = [];

                for (const coop of lista) {
                    if (cancelado) return;

                    let coord = null;
                    let consultouRede = false;

                    for (const consulta of candidatas(coop)) {
                        if (consulta in cache) {
                            coord = cache[consulta] || null;
                        } else {
                            // Nominatim permite no máximo 1 requisição por segundo
                            if (consultouRede) await espera(1100);
                            try {
                                coord = await geocodificar(consulta);
                                cache[consulta] = coord || false;
                                salvarCache(cache);
                            } catch {
                                coord = null;
                            }
                            consultouRede = true;
                            await espera(1100);
                        }
                        if (coord) break;
                    }

                    if (coord) {
                        encontrados.push({ ...coop, ...coord });
                        setPontos([...encontrados]);
                    }
                    setProcessadas((n) => n + 1);
                }
            } catch (e) {
                if (!cancelado) {
                    setErro(
                        e.response?.data?.detail ||
                        "Não foi possível carregar as cooperativas."
                    );
                }
            }
        }

        carregar();
        return () => {
            cancelado = true;
        };
    }, []);

    const localizando = total > 0 && processadas < total;

    return (
        <div>
            {erro && <p style={{ color: "#dc2626" }}>{erro}</p>}

            {localizando && (
                <p style={{ margin: "0 0 8px", fontSize: 14, opacity: 0.8 }}>
                    Localizando cooperativas no mapa… {processadas}/{total}
                </p>
            )}

            <div
                style={{
                    height: 420,
                    borderRadius: 12,
                    overflow: "hidden",
                    isolation: "isolate", // mantém o mapa abaixo de menus e modais
                }}
            >
                <MapContainer
                    center={CENTRO_PADRAO}
                    zoom={7}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <AjustarVista pontos={pontos} />

                    {pontos.map((p) => (
                        <Marker key={p.id} position={[p.lat, p.lng]}>
                            <Popup>
                                <strong>{p.nome}</strong>
                                <br />
                                {p.cidade}
                                {p.estado ? ` - ${p.estado}` : ""}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {total > 0 && !localizando && (
                <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.8 }}>
                    {pontos.length} de {total} cooperativas localizadas no mapa.
                </p>
            )}
        </div>
    );
}