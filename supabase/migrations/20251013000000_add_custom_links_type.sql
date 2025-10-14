-- Add link_type enum to custom_links table for type-safe link classification

-- Create enum type for link types
CREATE TYPE link_type AS ENUM ('website', 'tickets', 'custom');

-- Add link_type column with default 'custom' for backward compatibility
ALTER TABLE public.custom_links
ADD COLUMN link_type link_type NOT NULL DEFAULT 'custom';

-- Update existing links based on title
UPDATE public.custom_links
SET link_type = 'website'
WHERE LOWER(title) = 'website';

UPDATE public.custom_links
SET link_type = 'tickets'
WHERE LOWER(title) IN ('tickets', 'ticket', 'buy tickets');

-- Create index for performance on link_type queries
CREATE INDEX idx_custom_links_link_type ON public.custom_links(festival_id, link_type);

-- Add comment for documentation
COMMENT ON COLUMN public.custom_links.link_type IS 'Type of link: website (main festival site), tickets (ticket sales), or custom (user-defined)';
