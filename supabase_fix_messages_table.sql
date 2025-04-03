-- Lösche die Tabelle, falls sie existiert
DROP TABLE IF EXISTS messages;

-- Erstelle die Tabelle mit der korrekten Struktur
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Füge eine Test-Nachricht ein
INSERT INTO messages (sender_id, receiver_id, content, read)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Test-Nachricht', true);

-- Überprüfe die Struktur
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';
