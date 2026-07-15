import type { Vehicle, VehicleCondition, VehicleStatus } from "@/lib/types";
import { daysAgoISO } from "./clock";

const M = 1_000_000;

/**
 * Photos are hand-picked Unsplash images, visually verified to match each
 * unit's body type and colour (and where possible the actual model). Every
 * render goes through <VehicleImage>, which falls back to a branded
 * placeholder if a URL ever dies.
 */
const U = "https://images.unsplash.com/";
const P = {
  silverSedan: U + "photo-1716167950463-c21ddd1b38ca",
  whiteCorolla: U + "photo-1623869675781-80aa31012a5a",
  whiteSedan: U + "photo-1643793019410-b6ff1112da9b",
  whiteSedan2: U + "photo-1555215695-3004980ad54e",
  blackSedan: U + "photo-1619767886558-efdc259cde1a",
  blackSedan2: U + "photo-1569663485392-300558865df0",
  darkSedan: U + "photo-1633026879259-3df84cd3ea11",
  greySedan: U + "photo-1764089859664-30aa6919ef0b",
  blueSedan: U + "photo-1611064685748-ac1a43ec0ea5",
  blueSedan2: U + "photo-1617646167686-c7c260b78acb",
  blueCrossover: U + "photo-1599868407802-853a517be39c",
  redCar: U + "photo-1617531653332-bd46c24f2068",
  redHyundai: U + "photo-1550355291-bbee04a92027",
  whiteLuxSuv: U + "photo-1669691101370-9ee9ee0782dc",
  whiteLuxSuv2: U + "photo-1592857723369-03e2e792626d",
  darkLuxSuv: U + "photo-1603050087224-98d2e1e8930a",
  whiteCrv: U + "photo-1519641471654-76ce0107ad1b",
  whiteSuv: U + "photo-1684849311625-c7155af9b2fa",
  whiteSuvRear: U + "photo-1684849311625-b66671fb66d5",
  whiteSuvFront: U + "photo-1628573044443-a41b85b6f630",
  blackSuv: U + "photo-1627140290942-7c8f9f56e870",
  blackSuv2: U + "photo-1767749995450-7b63ab7cd4fd",
  silverMercSuv: U + "photo-1634636208509-63bcd2a1b13f",
  blackMercSuv: U + "photo-1654618345032-e3f3909750a8",
  greyWagon: U + "photo-1606664515524-ed2f786a0bd6",
  whitePickup: U + "photo-1628464682320-6a9ae020cb2b",
  whitePickup2: U + "photo-1622510992771-06c3259a58cf",
  greyRanger: U + "photo-1700943937372-12c2611b5af8",
  rangerLot: U + "photo-1609362092918-47a34787c260",
};

/** One photo per ROWS entry, same order. */
const PHOTO_LIST: string[] = [
  P.silverSedan, // Camry 2018 Silver
  P.whiteCorolla, // Corolla 2016 White
  P.darkSedan, // Corolla 2020 Grey
  P.blueCrossover, // RAV4 2019 Blue
  P.blackSuv, // Highlander 2018 Black
  P.whiteLuxSuv, // Land Cruiser 2021 White
  P.whitePickup, // Hilux 2020 White
  P.redCar, // Camry 2021 Red
  P.blackSedan, // Accord 2019 Black
  P.whiteCrv, // CR-V 2018
  P.whiteLuxSuv2, // RX 350 2018
  P.whiteSedan, // ES 350 2017 White
  P.blackMercSuv, // GLE 350 2019 Black
  P.blueSedan, // C 300 2018 Blue
  P.redHyundai, // Elantra 2019 Red
  P.whiteSuv, // Sportage 2019 White
  P.greyRanger, // Ranger 2019 Grey
  P.blackSedan2, // Corolla 2025 Black (brand new)
  P.greySedan, // Camry 2013 Grey
  P.whiteSedan2, // Accord 2015 White
  P.whiteSuvFront, // RAV4 2021 White (reserved)
  P.darkLuxSuv, // GX 460 2019 Black (reserved)
  P.rangerLot, // Hilux 2023 Red (reserved)
  P.silverMercSuv, // GLK 350 2014 Silver (repair)
  P.greyWagon, // Venza 2015 Grey (repair)
  P.whiteSuvRear, // RAV4 2020 Silver (transit)
  P.blackSuv2, // Pilot 2019 Black (transit)
  P.blueSedan2, // Corolla 2019 Blue (transit)
  P.whiteCorolla, // Corolla 2017 Silver (sold)
  P.whiteSedan2, // Camry 2019 White (sold)
  P.darkLuxSuv, // RX 350 2016 Black (sold)
  P.whiteCrv, // CR-V 2017 Red (sold)
  P.blackSuv, // Highlander 2017 Grey (sold)
  P.blueSedan, // Sonata 2018 Blue (sold)
  P.whitePickup2, // Hilux 2018 White (sold)
  P.darkSedan, // Cerato 2017 Black (sold)
];

const PHOTO_PARAMS = "?auto=format&fit=crop&w=900&q=70";

type Row = [
  make: string,
  model: string,
  year: number,
  trim: string,
  body: Vehicle["bodyType"],
  condition: VehicleCondition,
  color: string,
  mileageKm: number,
  purchase: number,
  clearing: number,
  repair: number,
  listing: number,
  status: VehicleStatus,
  daysInStock: number,
  location: Vehicle["location"],
  assignedTo?: string,
  soldDaysAgo?: number,
  soldPrice?: number,
];

// prettier-ignore
const ROWS: Row[] = [
  // Available — the working showroom stock
  ["Toyota", "Camry", 2018, "XLE", "Sedan", "Foreign Used", "Silver", 84000, 11.5*M, 2.1*M, 0.4*M, 16.8*M, "Available", 94, "Showroom A", "u-tunde"],
  ["Toyota", "Corolla", 2016, "LE", "Sedan", "Foreign Used", "White", 96000, 6.8*M, 1.6*M, 0.3*M, 10.2*M, "Available", 11, "Showroom A", "u-emeka"],
  ["Toyota", "Corolla", 2020, "XLE", "Sedan", "Foreign Used", "Grey", 42000, 12.4*M, 2.2*M, 0.2*M, 17.5*M, "Available", 8, "Showroom A", "u-tunde"],
  ["Toyota", "RAV4", 2019, "XLE AWD", "SUV", "Foreign Used", "Blue", 58000, 18.2*M, 2.8*M, 0.5*M, 25.9*M, "Available", 14, "Showroom A", "u-emeka"],
  ["Toyota", "Highlander", 2018, "XLE", "SUV", "Foreign Used", "Black", 74000, 19.5*M, 3.1*M, 0.8*M, 27.8*M, "Available", 37, "Showroom B", "u-tunde"],
  ["Toyota", "Land Cruiser", 2021, "VXR", "SUV", "Foreign Used", "White", 39000, 95*M, 8.5*M, 1.2*M, 128*M, "Available", 52, "Showroom B", "u-chinedu"],
  ["Toyota", "Hilux", 2020, "SR5 4x4", "Pickup", "Foreign Used", "White", 61000, 27*M, 3.6*M, 0.6*M, 38.5*M, "Available", 21, "Lot", "u-emeka"],
  ["Toyota", "Camry", 2021, "SE", "Sedan", "Foreign Used", "Red", 33000, 17.8*M, 2.6*M, 0.3*M, 24.5*M, "Available", 6, "Showroom A", "u-tunde"],
  ["Honda", "Accord", 2019, "EX-L", "Sedan", "Foreign Used", "Black", 52000, 13.2*M, 2.3*M, 0.5*M, 18.9*M, "Available", 43, "Showroom A", "u-emeka"],
  ["Honda", "CR-V", 2018, "EX", "SUV", "Foreign Used", "Grey", 67000, 14.6*M, 2.4*M, 0.6*M, 20.5*M, "Available", 29, "Showroom B", "u-tunde"],
  ["Lexus", "RX 350", 2018, "F Sport", "SUV", "Foreign Used", "Silver", 62000, 28.5*M, 3.9*M, 0.7*M, 38.9*M, "Available", 66, "Showroom B", "u-chinedu"],
  ["Lexus", "ES 350", 2017, "Luxury", "Sedan", "Foreign Used", "White", 71000, 18.4*M, 2.7*M, 0.4*M, 25.5*M, "Available", 48, "Showroom A", "u-emeka"],
  ["Mercedes-Benz", "GLE 350", 2019, "4MATIC", "SUV", "Foreign Used", "Black", 49000, 41*M, 5.2*M, 0.9*M, 56.5*M, "Available", 73, "Showroom B", "u-chinedu"],
  ["Mercedes-Benz", "C 300", 2018, "AMG Line", "Sedan", "Foreign Used", "Blue", 56000, 20.8*M, 3.0*M, 0.6*M, 28.9*M, "Available", 59, "Showroom A", "u-tunde"],
  ["Hyundai", "Elantra", 2019, "SEL", "Sedan", "Foreign Used", "Red", 47000, 8.4*M, 1.7*M, 0.3*M, 12.3*M, "Available", 17, "Lot", "u-emeka"],
  ["Kia", "Sportage", 2019, "LX", "SUV", "Foreign Used", "White", 53000, 10.2*M, 1.9*M, 0.4*M, 14.8*M, "Available", 24, "Lot", "u-tunde"],
  ["Ford", "Ranger", 2019, "XLT 4x4", "Pickup", "Foreign Used", "Grey", 69000, 19.8*M, 3.2*M, 0.9*M, 28.4*M, "Available", 81, "Lot", "u-emeka"],
  ["Toyota", "Corolla", 2025, "XLE", "Sedan", "Brand New", "Black", 0, 38*M, 4.5*M, 0, 52*M, "Available", 19, "Showroom A", "u-chinedu"],
  ["Toyota", "Camry", 2013, "LE", "Sedan", "Nigerian Used", "Grey", 142000, 5.6*M, 0, 0.7*M, 8.2*M, "Available", 33, "Lot", "u-tunde"],
  ["Honda", "Accord", 2015, "Sport", "Sedan", "Nigerian Used", "White", 118000, 6.2*M, 0, 0.5*M, 8.9*M, "Available", 27, "Lot", "u-emeka"],
  // Reserved
  ["Toyota", "RAV4", 2021, "Limited", "SUV", "Foreign Used", "White", 36000, 24.5*M, 3.3*M, 0.3*M, 33.8*M, "Reserved", 12, "Showroom A", "u-tunde"],
  ["Lexus", "GX 460", 2019, "Premium", "SUV", "Foreign Used", "Black", 51000, 52*M, 6.1*M, 0.8*M, 69.5*M, "Reserved", 40, "Showroom B", "u-chinedu"],
  ["Toyota", "Hilux", 2023, "Adventure", "Pickup", "Brand New", "Red", 0, 58*M, 6.4*M, 0, 76*M, "Reserved", 9, "Showroom B", "u-chinedu"],
  // In repair
  ["Mercedes-Benz", "GLK 350", 2014, "4MATIC", "SUV", "Nigerian Used", "Silver", 128000, 9.8*M, 0, 1.6*M, 14.5*M, "In Repair", 35, "Workshop"],
  ["Toyota", "Venza", 2015, "XLE", "SUV", "Foreign Used", "Grey", 92000, 11.4*M, 2.0*M, 1.1*M, 16.2*M, "In Repair", 22, "Workshop"],
  // In transit (incoming from Lagos port)
  ["Toyota", "RAV4", 2020, "XLE", "SUV", "Foreign Used", "Silver", 44000, 20.6*M, 2.9*M, 0, 28.5*M, "In Transit", 5, "Port"],
  ["Honda", "Pilot", 2019, "EX-L", "SUV", "Foreign Used", "Black", 57000, 18.9*M, 2.8*M, 0, 26.9*M, "In Transit", 3, "Port"],
  ["Toyota", "Corolla", 2019, "SE", "Sedan", "Foreign Used", "Blue", 49000, 9.9*M, 1.8*M, 0, 14.2*M, "In Transit", 7, "Port"],
  // Sold — recent, feeds the sales dashboards
  ["Toyota", "Corolla", 2017, "LE", "Sedan", "Foreign Used", "Silver", 88000, 7.4*M, 1.6*M, 0.4*M, 11.5*M, "Sold", 15, "Showroom A", "u-tunde", 4, 11.2*M],
  ["Toyota", "Camry", 2019, "SE", "Sedan", "Foreign Used", "White", 61000, 13.8*M, 2.3*M, 0.3*M, 19.5*M, "Sold", 28, "Showroom A", "u-emeka", 9, 19.0*M],
  ["Lexus", "RX 350", 2016, "Base", "SUV", "Foreign Used", "Black", 83000, 21.5*M, 3.2*M, 0.9*M, 29.8*M, "Sold", 41, "Showroom B", "u-chinedu", 13, 29.0*M],
  ["Honda", "CR-V", 2017, "LX", "SUV", "Foreign Used", "Red", 76000, 11.8*M, 2.1*M, 0.5*M, 16.9*M, "Sold", 19, "Showroom B", "u-tunde", 17, 16.5*M],
  ["Toyota", "Highlander", 2017, "LE", "SUV", "Foreign Used", "Grey", 81000, 16.4*M, 2.7*M, 0.8*M, 23.5*M, "Sold", 52, "Showroom B", "u-emeka", 24, 22.8*M],
  ["Hyundai", "Sonata", 2018, "SEL", "Sedan", "Foreign Used", "Blue", 59000, 8.9*M, 1.8*M, 0.4*M, 13.2*M, "Sold", 31, "Showroom A", "u-tunde", 30, 12.9*M],
  ["Toyota", "Hilux", 2018, "SR", "Pickup", "Foreign Used", "White", 87000, 21*M, 3.1*M, 0.7*M, 29.9*M, "Sold", 44, "Lot", "u-chinedu", 38, 29.5*M],
  ["Kia", "Cerato", 2017, "EX", "Sedan", "Nigerian Used", "Black", 102000, 5.4*M, 0, 0.5*M, 7.9*M, "Sold", 26, "Lot", "u-emeka", 45, 7.6*M],
];

function vin(i: number): string {
  const base = "JTDBE32K8AC10";
  return base + String(1000 + i * 37).slice(-4);
}

export const VEHICLES: Vehicle[] = ROWS.map((r, i) => {
  const [
    make, model, year, trim, bodyType, condition, color, mileageKm,
    purchasePrice, clearingCost, repairCost, listingPrice, status,
    daysInStock, location, assignedTo, soldDaysAgo, soldPrice,
  ] = r;
  return {
    id: `v-${String(i + 1).padStart(3, "0")}`,
    make,
    model,
    year,
    trim,
    vin: vin(i),
    color,
    mileageKm,
    condition,
    bodyType,
    transmission: "Automatic",
    fuel: bodyType === "Pickup" ? "Diesel" : "Petrol",
    purchasePrice,
    clearingCost,
    repairCost,
    listingPrice,
    status,
    daysInStock,
    acquiredAt: daysAgoISO(daysInStock + (soldDaysAgo ?? 0)),
    soldAt: soldDaysAgo !== undefined ? daysAgoISO(soldDaysAgo) : undefined,
    soldPrice,
    assignedTo,
    photo: PHOTO_LIST[i] + PHOTO_PARAMS,
    location,
  };
});
