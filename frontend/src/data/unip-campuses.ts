export interface UnipCampus {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  fullLocation: string;
  lat: number;
  lon: number;
  neighborhood?: string;
  address?: string;
}

export const UNIP_CAMPUSES: UnipCampus[] = [
  {
    id: "sorocaba",
    name: "UNIP - Sorocaba",
    shortName: "Sorocaba",
    city: "Sorocaba",
    state: "SP",
    fullLocation: "Sorocaba - SP",
    lat: -23.5015,
    lon: -47.4526,
    neighborhood: "Éden",
    address: "Av. Independência, 210 - Éden, Sorocaba - SP",
  },
];


// Lista de cidades únicas
export const UNIQUE_CITIES = Array.from(
  new Set(UNIP_CAMPUSES.map((c) => c.fullLocation))
).sort();
