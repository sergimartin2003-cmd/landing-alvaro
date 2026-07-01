// Tipos de la base de datos de GTshop.
// Compatibles con el genérico de @supabase/supabase-js para queries tipadas.
// Si prefieres autogenerarlos: `supabase gen types typescript --local > src/lib/types/database.ts`.

export type OrderStatus =
  | "pendiente"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          order_index?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category_id: string;
          base_price: number;
          images: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category_id: string;
          base_price?: number;
          images?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          stock: number;
          sku: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          stock?: number;
          sku: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country: string;
          total_amount: number;
          status: OrderStatus;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country?: string;
          total_amount?: number;
          status?: OrderStatus;
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          size: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          size: string;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      admin_users: {
        Row: { user_id: string; email: string | null; created_at: string };
        Insert: { user_id: string; email?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      confirm_order_paid: {
        Args: { p_order_id: string; p_session_id: string };
        Returns: undefined;
      };
    };
    Enums: { order_status: OrderStatus };
    CompositeTypes: Record<string, never>;
  };
}

// Alias cómodos para el resto de la app.
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

// Tipos compuestos usados en la UI.
export type ProductWithVariants = Product & {
  category: Pick<Category, "name" | "slug"> | null;
  variants: ProductVariant[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
