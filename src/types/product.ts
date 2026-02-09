export type Gender = "Masculino" | "Femenino" | "Unisex";

export type Style = "Designer" | "Arabe";

export type Temporada = "Primavera" | "Verano" | "Otoño" | "Invierno";

export type Horario = "Mañana" | "Tarde" | "Noche";

export type Ocasion = "Casual" | "Formal" | "Trabajo" | "Cita" | "Fiesta" | "Deporte";

export type Edad = "Juvenil" | "Joven" | "Adulto" | "Todos";

export type Oferta = {
  activa: boolean;
  precioOferta: number | null;
  porcentajeDesc: number | null;
  etiqueta: string;
  desde: string | null;
  hasta: string | null;
};

export type Precios = {
  unitario: number | null;
  mayorista_3: number | null;
  mayorista_10: number | null;
  decant: number | null;
};

export type Product = {
  id: string;
  nombre: string;
  label: string | null;
  marca: string;
  genero: Gender;
  estilo: Style;
  concentracion: string | null;
  volumen: string | null;
  imagen: string | null;
  notas: string;
  costo: number | null;
  temporadas: Temporada[];
  horarios: Horario[];
  ocasiones: Ocasion[];
  versatilidad: 1 | 2 | 3 | 4 | 5;
  edades: Edad[];
  precios: Precios;
  stock: number;
  oferta: Oferta | null;
  active: boolean;
};

export type VentaItem = {
  productId: string;
  nombre: string;
  marca: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type Venta = {
  id: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  vendedor: string;
};
