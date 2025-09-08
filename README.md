# GEIAL - AI-Powered Business Intelligence Platform

GEIAL is an AI-powered business intelligence platform that transforms PDF reports into actionable insights and automated communications for different ecosystems/regions.

## 🚀 Features

### 📄 Advanced PDF Processing
- Upload PDF reports for different ecosystems/regions
- Extract text using pdf-parse (no external API dependencies)
- Smart chunking with section detection (1000-char chunks, 200-char overlap)
- Automatic categorization (resumen, fortalezas, retos, recomendaciones, métricas, etc.)

### 🤖 AI-Powered Content Generation
- Generate "Comunicados" (Press Releases) using GPT-3.5-turbo
- Create executive summaries using GPT-4-mini
- Context-aware responses based on report content
- Multi-language support (Spanish/English)

### 🔍 RAG (Retrieval Augmented Generation) System
- Vector embeddings using OpenAI text-embedding-3-small
- Semantic search across all documents using pgvector
- Similarity-based retrieval with configurable thresholds
- Context-aware AI answers based on specific document chunks
- Advanced search by section type and report

### 📊 Database & Vector Storage
- PostgreSQL with pgvector for embeddings storage
- Supabase integration for authentication and data management
- Efficient indexing for fast similarity searches
- Automatic relationship management between reports and chunks

### 📧 Communication & Distribution
- Contact management system for stakeholders
- Email distribution of reports and comunicados
- Track delivery status and engagement
- Customizable messaging for different audiences

### 🌍 Multi-Ecosystem Management
- Location-based report organization
- Comparative analysis between regions/ecosystems
- Ecosystem-specific insights and trends
- Regional performance tracking

### ⚙️ Advanced Processing Pipeline
- Queue-based processing for heavy operations
- Netlify Functions for serverless processing
- Real-time status tracking for all operations
- Automatic reprocessing capabilities
- Debug panels for system monitoring

### 🔐 Security & Access Control
- Supabase authentication with row-level security
- Role-based access (admin panel vs public interface)
- Secure file storage for PDF documents
- Environment-based configuration

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-3.5/4 + text-embedding-3-small
- **PDF Processing**: pdf-parse (local processing)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=development
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Enable pgvector extension
   - Set up storage bucket for reports

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Start Netlify Functions locally**
   ```bash
   npm run netlify:dev
   ```

## 📁 Project Structure

```
geial/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth, Database)
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # App entry point
├── netlify/
│   └── functions/         # Netlify Functions
│       ├── process-report.ts
│       ├── search.ts
│       ├── generate-comunicado.ts
│       └── generate-summary.ts
├── database/
│   └── schema.sql         # Database schema
├── public/                # Static assets
└── dist/                  # Build output
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable the pgvector extension
3. Run the database schema from `database/schema.sql`
4. Create a storage bucket named "reports"
5. Set up Row Level Security policies

### OpenAI Configuration

1. Get your OpenAI API key from https://platform.openai.com/
2. Add it to your environment variables
3. Ensure you have credits for GPT-3.5-turbo and text-embedding-3-small

### Netlify Deployment

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with the build command: `npm run build`
4. Functions will be automatically deployed

## 📖 Usage

### Uploading Reports

1. Navigate to the Upload page
2. Select a PDF file (max 10MB)
3. Fill in report details (title, ecosystem, region)
4. Submit for processing

### Searching Documents

1. Go to the Search page
2. Enter your query in natural language
3. Optionally filter by ecosystem or region
4. View semantically similar results

### Generating Comunicados

1. Select multiple reports
2. Provide a title for the comunicado
3. Generate AI-powered press release
4. Review and send to contacts

### Managing Contacts

1. Add stakeholder contacts
2. Organize by ecosystem and region
3. Use for report distribution
4. Track engagement

## 🎯 Target Users

- **Business Analysts** - Process and analyze regional reports
- **Communications Teams** - Create press releases and summaries
- **Executives** - Get quick insights from multiple reports
- **Regional Managers** - Track ecosystem performance
- **Research Teams** - Query specific information across documents

## 💼 Real-World Use Cases

### 📈 Business Intelligence
- Upload quarterly business reports → Get AI summaries
- Compare performance between different regions
- Track KPIs and metrics across ecosystems
- Generate executive dashboards

### 📰 Content Creation
- Generate press releases based on multiple reports
- Create marketing content from technical documents
- Produce stakeholder communications
- Generate social media content

### 🔍 Knowledge Management
- Search specific information across all documents
- Get context-aware answers to business questions
- Find relevant sections across multiple reports
- Research trends and patterns

### 📧 Stakeholder Communication
- Distribute reports to contact lists
- Send automated summaries to stakeholders
- Track engagement and delivery
- Customize messaging for different audiences

## 🔒 Security

- All data is encrypted in transit and at rest
- Row-level security ensures users only access their data
- API keys are stored securely in environment variables
- File uploads are validated and sanitized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🚀 Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 📊 Performance

- Vector similarity search is optimized with pgvector
- Chunking strategy balances context and performance
- Caching for frequently accessed data
- Lazy loading for large document sets

## 🔄 Updates

The platform is actively maintained and updated with new features and improvements. Check the changelog for recent updates.
