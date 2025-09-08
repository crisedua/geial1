-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ecosystems table
CREATE TABLE IF NOT EXISTS ecosystems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    ecosystem TEXT NOT NULL,
    region TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create chunks table for document chunks
CREATE TABLE IF NOT EXISTS chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    section_type TEXT DEFAULT 'other' CHECK (section_type IN ('resumen', 'fortalezas', 'retos', 'recomendaciones', 'métricas', 'other')),
    chunk_index INTEGER NOT NULL,
    start_char INTEGER NOT NULL,
    end_char INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    role TEXT,
    ecosystem TEXT,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create comunicados table
CREATE TABLE IF NOT EXISTS comunicados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    report_ids UUID[] NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create processing_status table for tracking report processing
CREATE TABLE IF NOT EXISTS processing_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('uploading', 'extracting', 'chunking', 'embedding', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public_requests table for tracking public form submissions
CREATE TABLE IF NOT EXISTS public_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ecosystem TEXT NOT NULL,
    focus TEXT,
    date TEXT,
    milestone TEXT,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reports_used UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_ecosystem ON reports(ecosystem);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_chunks_report_id ON chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_chunks_section_type ON chunks(section_type);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON chunks(chunk_index);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ecosystem ON contacts(ecosystem);
CREATE INDEX IF NOT EXISTS idx_contacts_region ON contacts(region);

CREATE INDEX IF NOT EXISTS idx_comunicados_user_id ON comunicados(user_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_status ON comunicados(status);

CREATE INDEX IF NOT EXISTS idx_processing_status_report_id ON processing_status(report_id);
CREATE INDEX IF NOT EXISTS idx_processing_status_status ON processing_status(status);

CREATE INDEX IF NOT EXISTS idx_public_requests_ecosystem ON public_requests(ecosystem);
CREATE INDEX IF NOT EXISTS idx_public_requests_email ON public_requests(email);
CREATE INDEX IF NOT EXISTS idx_public_requests_status ON public_requests(status);
CREATE INDEX IF NOT EXISTS idx_public_requests_created_at ON public_requests(created_at);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    report_id UUID,
    content TEXT,
    section_type TEXT,
    chunk_index INTEGER,
    start_char INTEGER,
    end_char INTEGER,
    embedding VECTOR(1536),
    similarity FLOAT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        chunks.id,
        chunks.report_id,
        chunks.content,
        chunks.section_type,
        chunks.chunk_index,
        chunks.start_char,
        chunks.end_char,
        chunks.embedding,
        1 - (chunks.embedding <=> query_embedding) AS similarity,
        chunks.created_at
    FROM chunks
    WHERE chunks.embedding IS NOT NULL
    AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comunicados_updated_at BEFORE UPDATE ON comunicados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_status_updated_at BEFORE UPDATE ON processing_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_requests_updated_at BEFORE UPDATE ON public_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE USING (auth.uid() = user_id);

-- Chunks policies
CREATE POLICY "Users can view chunks from own reports" ON chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE reports.id = chunks.report_id 
            AND reports.user_id = auth.uid()
        )
    );

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Comunicados policies
CREATE POLICY "Users can view own comunicados" ON comunicados
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comunicados" ON comunicados
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comunicados" ON comunicados
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comunicados" ON comunicados
    FOR DELETE USING (auth.uid() = user_id);

-- Processing status policies
CREATE POLICY "Users can view processing status for own reports" ON processing_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE reports.id = processing_status.report_id 
            AND reports.user_id = auth.uid()
        )
    );

-- Public requests policies (allow public access for form submissions)
CREATE POLICY "Anyone can insert public requests" ON public_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can view all public requests" ON public_requests
    FOR SELECT USING (true);

-- Insert default ecosystems
INSERT INTO ecosystems (name, region, description) VALUES
('Fintech', 'Latin America', 'Financial technology ecosystem'),
('Edtech', 'Latin America', 'Educational technology ecosystem'),
('Healthtech', 'Latin America', 'Healthcare technology ecosystem'),
('Agtech', 'Latin America', 'Agricultural technology ecosystem'),
('Cleantech', 'Latin America', 'Clean technology ecosystem')
ON CONFLICT DO NOTHING;
