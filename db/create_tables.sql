-- Haupttabellen für die Reha-Anwendung

-- Kurse-Tabelle
CREATE TABLE IF NOT EXISTS kurse (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  beschreibung TEXT,
  max_teilnehmer INTEGER,
  start_datum TIMESTAMP WITH TIME ZONE,
  end_datum TIMESTAMP WITH TIME ZONE,
  aktiv BOOLEAN DEFAULT true,
  trainer_id UUID REFERENCES trainer(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teilnehmer-Tabelle
CREATE TABLE IF NOT EXISTS teilnehmer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vorname VARCHAR(255) NOT NULL,
  nachname VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefon VARCHAR(50),
  geburtsdatum DATE,
  strasse VARCHAR(255),
  plz VARCHAR(10),
  ort VARCHAR(255),
  aktiv BOOLEAN DEFAULT true,
  notizen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verlaufstabelle für Teilnehmer
CREATE TABLE IF NOT EXISTS teilnehmer_verlauf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teilnehmer_id UUID REFERENCES teilnehmer(id) ON DELETE CASCADE,
  aktion VARCHAR(50) NOT NULL,
  details TEXT,
  benutzer_id UUID,
  datum TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kurs-Teilnehmer-Zuordnung (N:M)
CREATE TABLE IF NOT EXISTS kurs_teilnehmer (
  kurs_id UUID NOT NULL REFERENCES kurse(id) ON DELETE CASCADE, 
  teilnehmer_id UUID NOT NULL REFERENCES teilnehmer(id) ON DELETE CASCADE, 
  hinzugefuegt_am TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (kurs_id, teilnehmer_id) 
);

-- Dashboard-Tabellen

-- Tabelle für Umsatzdaten
CREATE TABLE IF NOT EXISTS umsatz (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monat DATE NOT NULL,
  summe DECIMAL(10, 2) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Teilnehmerentwicklung (monatlich)
CREATE TABLE IF NOT EXISTS teilnehmer_entwicklung (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monat DATE NOT NULL,
  aktiv INTEGER NOT NULL DEFAULT 0,
  inaktiv INTEGER NOT NULL DEFAULT 0,
  neu INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Kursauslastung
CREATE TABLE IF NOT EXISTS kurs_auslastung (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kurs_id UUID REFERENCES kurse(id) ON DELETE CASCADE,
  woche DATE NOT NULL,
  auslastung_prozent INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Teilnehmerrollen (z.B. Selbstzahler, Krankenkasse, etc.)
CREATE TABLE IF NOT EXISTS teilnehmer_rollen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rolle VARCHAR(50) NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 0,
  monat DATE NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer-Tabelle
CREATE TABLE IF NOT EXISTS trainer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vorname VARCHAR(255) NOT NULL,
  nachname VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefon VARCHAR(50),
  qualifikation TEXT,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Leads / Interessenten
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, 
  interest VARCHAR(100) NOT NULL, 
  source VARCHAR(100), 
  status VARCHAR(50) DEFAULT 'neu', 
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Beispieldaten für Trainer
INSERT INTO trainer (vorname, nachname, email, qualifikation, aktiv)
VALUES 
  ('Peter', 'Schmidt', 'peter.schmidt@reha.example', 'Physiotherapeut, Sportwissenschaftler', true),
  ('Sabine', 'Mayer', 'sabine.mayer@reha.example', 'Ergotherapeutin', true),
  ('Klaus', 'Weber', 'klaus.weber@reha.example', 'Fitnesstrainer B-Lizenz', false);

-- Beispieldaten für Kurse
INSERT INTO kurse (name, beschreibung, max_teilnehmer, start_datum, end_datum, aktiv, trainer_id)
VALUES 
  ('Reha-Kurs A', 'Grundlegende Rehabilitation für Einsteiger', 15, '2025-04-10 09:00:00+02', '2025-07-10 10:00:00+02', true, (SELECT id FROM trainer WHERE email = 'peter.schmidt@reha.example' LIMIT 1)),
  ('Reha-Kurs B', 'Fortgeschrittene Rehabilitation', 12, '2025-04-10 10:30:00+02', '2025-07-10 11:30:00+02', true, (SELECT id FROM trainer WHERE email = 'sabine.mayer@reha.example' LIMIT 1)),
  ('Rückentraining', 'Spezifisches Training für Rückenprobleme', 10, '2025-04-11 14:00:00+02', '2025-06-11 15:00:00+02', true, (SELECT id FROM trainer WHERE email = 'peter.schmidt@reha.example' LIMIT 1)),
  ('Gelenkschonendes Training', 'Für Personen mit Gelenkproblemen', 8, '2025-04-11 15:30:00+02', '2025-06-11 16:30:00+02', true, (SELECT id FROM trainer WHERE email = 'sabine.mayer@reha.example' LIMIT 1)),
  ('Seniorentraining', 'Angepasstes Training für Senioren', 10, '2025-04-14 10:00:00+02', '2025-07-14 11:00:00+02', true, NULL);

-- Beispieldaten für Teilnehmer
INSERT INTO teilnehmer (vorname, nachname, email, telefon, geburtsdatum, strasse, plz, ort, aktiv, notizen)
VALUES 
  ('Max', 'Mustermann', 'max.mustermann@example.com', '0123456789', '1985-05-15', 'Musterstraße 1', '12345', 'Musterstadt', true, 'Hat Knieprobleme'),
  ('Erika', 'Mustermann', 'erika.mustermann@example.com', '0987654321', '1990-08-20', 'Beispielweg 2', '54321', 'Beispielhausen', true, NULL),
  ('Anna', 'Schmidt', 'anna.schmidt@mail.com', '01761122334', '1978-11-01', 'Hauptstr. 10a', '10115', 'Berlin', true, 'Selbstzahlerin'),
  ('Paul', 'Müller', 'paul.mueller@provider.net', '01519988776', '1995-02-28', 'Gartenweg 5', '80331', 'München', false, 'Warteliste');

-- Beispieldaten für Kurs-Teilnehmer-Zuordnungen
INSERT INTO kurs_teilnehmer (kurs_id, teilnehmer_id)
VALUES
  -- Max ist in Kurs A und Rückentraining
  ((SELECT id FROM kurse WHERE name = 'Reha-Kurs A'), (SELECT id FROM teilnehmer WHERE email = 'max.mustermann@example.com')),
  ((SELECT id FROM kurse WHERE name = 'Rückentraining'), (SELECT id FROM teilnehmer WHERE email = 'max.mustermann@example.com')),
  -- Erika ist in Kurs A
  ((SELECT id FROM kurse WHERE name = 'Reha-Kurs A'), (SELECT id FROM teilnehmer WHERE email = 'erika.mustermann@example.com')),
   -- Anna ist in Kurs B
  ((SELECT id FROM kurse WHERE name = 'Reha-Kurs B'), (SELECT id FROM teilnehmer WHERE email = 'anna.schmidt@mail.com'));

-- Beispieldaten für Umsatz
INSERT INTO umsatz (monat, summe, details)
VALUES 
  (DATE_TRUNC('month', NOW() - INTERVAL '5 months'), 1850.50, '{"kurse": 12, "teilnehmer": 35}'),
  (DATE_TRUNC('month', NOW() - INTERVAL '4 months'), 2100.75, '{"kurse": 14, "teilnehmer": 40}'),
  (DATE_TRUNC('month', NOW() - INTERVAL '3 months'), 2350.25, '{"kurse": 15, "teilnehmer": 45}'),
  (DATE_TRUNC('month', NOW() - INTERVAL '2 months'), 2450.50, '{"kurse": 15, "teilnehmer": 48}'),
  (DATE_TRUNC('month', NOW() - INTERVAL '1 month'), 2600.00, '{"kurse": 16, "teilnehmer": 52}'),
  (DATE_TRUNC('month', NOW()), 2750.75, '{"kurse": 17, "teilnehmer": 55}');

-- Beispieldaten für Teilnehmerentwicklung
INSERT INTO teilnehmer_entwicklung (monat, aktiv, inaktiv, neu)
VALUES 
  (DATE_TRUNC('month', NOW() - INTERVAL '5 months'), 45, 5, 8),
  (DATE_TRUNC('month', NOW() - INTERVAL '4 months'), 50, 7, 12),
  (DATE_TRUNC('month', NOW() - INTERVAL '3 months'), 55, 8, 13),
  (DATE_TRUNC('month', NOW() - INTERVAL '2 months'), 60, 6, 11),
  (DATE_TRUNC('month', NOW() - INTERVAL '1 month'), 65, 5, 10),
  (DATE_TRUNC('month', NOW()), 70, 4, 9);

-- Beispieldaten für Kursauslastung
INSERT INTO kurs_auslastung (kurs_id, woche, auslastung_prozent)
VALUES 
  ((SELECT id FROM kurse WHERE name = 'Reha-Kurs A' LIMIT 1), DATE_TRUNC('week', NOW()), 85),
  ((SELECT id FROM kurse WHERE name = 'Reha-Kurs B' LIMIT 1), DATE_TRUNC('week', NOW()), 75),
  ((SELECT id FROM kurse WHERE name = 'Rückentraining' LIMIT 1), DATE_TRUNC('week', NOW()), 90),
  ((SELECT id FROM kurse WHERE name = 'Gelenkschonendes Training' LIMIT 1), DATE_TRUNC('week', NOW()), 95),
  ((SELECT id FROM kurse WHERE name = 'Seniorentraining' LIMIT 1), DATE_TRUNC('week', NOW()), 70);

-- Beispieldaten für Teilnehmerrollen
INSERT INTO teilnehmer_rollen (rolle, anzahl, monat)
VALUES 
  ('Selbstzahler', 30, DATE_TRUNC('month', NOW())),
  ('Krankenkasse', 45, DATE_TRUNC('month', NOW())),
  ('Rentenversicherung', 15, DATE_TRUNC('month', NOW())),
  ('Berufsgenossenschaft', 10, DATE_TRUNC('month', NOW()));

-- Beispiel-Leads (optional)
/*
INSERT INTO leads (name, email, interest, source, status) VALUES
  ('Max Mustermann', 'max.mustermann@email.com', 'Rehasport', 'Google', 'neu'),
  ('Erika Musterfrau', 'erika.musterfrau@email.com', 'Rückenschule', 'Empfehlung', 'kontaktiert');
*/

-- Tabelle für die Zuordnung von Kursen zu Teilnehmern (Many-to-Many)

-- Tabelle: dokumente
CREATE TABLE dokumente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teilnehmer_id UUID REFERENCES teilnehmer(id) ON DELETE SET NULL, 
    dokument_typ VARCHAR(100) NOT NULL CHECK (dokument_typ <> ''),
    dateiname VARCHAR(255) NOT NULL CHECK (dateiname <> ''),
    storage_path TEXT UNIQUE NOT NULL CHECK (storage_path <> ''), 
    mime_type VARCHAR(100),
    file_size BIGINT, 
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT fk_teilnehmer FOREIGN KEY (teilnehmer_id) REFERENCES teilnehmer(id) ON DELETE SET NULL
);

CREATE INDEX idx_dokumente_teilnehmer_id ON dokumente(teilnehmer_id);
CREATE INDEX idx_dokumente_typ ON dokumente(dokument_typ);
CREATE INDEX idx_dokumente_uploaded_at ON dokumente(uploaded_at);

COMMENT ON TABLE dokumente IS 'Speichert Metadaten zu hochgeladenen oder generierten Dokumenten für Teilnehmer.';
COMMENT ON COLUMN dokumente.teilnehmer_id IS 'Referenz zum Teilnehmer, dem das Dokument zugeordnet ist.';
COMMENT ON COLUMN dokumente.dokument_typ IS 'Art des Dokuments (z.B. Verordnung, Bescheinigung, Anmeldung, Generiert).';
COMMENT ON COLUMN dokumente.dateiname IS 'Ursprünglicher oder generierter Dateiname des Dokuments.';
COMMENT ON COLUMN dokumente.storage_path IS 'Eindeutiger Pfad zur Datei im Supabase Storage Bucket.';
COMMENT ON COLUMN dokumente.mime_type IS 'MIME-Typ der Datei (z.B. application/pdf, image/jpeg).';
COMMENT ON COLUMN dokumente.file_size IS 'Dateigröße in Bytes.';
COMMENT ON COLUMN dokumente.uploaded_at IS 'Zeitstempel des Uploads oder der Generierung.';

COMMENT ON COLUMN leads.source IS 'Quelle des Leads (z.B. Website, Messe, Empfehlung).';
COMMENT ON COLUMN leads.status IS 'Aktueller Status des Leads im Verkaufsprozess.';
