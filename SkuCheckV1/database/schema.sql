CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  website text NOT NULL,
  phone text,
  city text,
  platform text NOT NULL DEFAULT 'Other',
  tier text,
  online_sales boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  title text,
  brand text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id),
  sku text NOT NULL,
  product_title text,
  status text NOT NULL,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  price text,
  product_url text,
  confidence text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
