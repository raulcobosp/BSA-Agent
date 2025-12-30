import React, { useState } from 'react';
import { ProposalRequest, HyperScaler, ContextDensity } from '../types';
import { LayoutTemplate, Cloud, Languages, Building2, FileText, ArrowRight, Bot, Image as ImageIcon, Layers, Clock, Sliders } from 'lucide-react';

interface InputStepProps {
  onNext: (data: ProposalRequest) => void;
}

const InputStep: React.FC<InputStepProps> = ({ onNext }) => {
  const [companyName, setCompanyName] = useState('');
  const [businessCase, setBusinessCase] = useState('');
  const [hyperScaler, setHyperScaler] = useState<HyperScaler>('AWS');
  const [language, setLanguage] = useState('English');
  const [textModel, setTextModel] = useState('gemini-3-pro-preview');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');

  // New State for Advanced Controls
  const [contextDensity, setContextDensity] = useState<ContextDensity>('high');
  const [apiDelay, setApiDelay] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName && businessCase) {
      onNext({
        companyName,
        businessCase,
        hyperScaler,
        language,
        textModel,
        imageModel,
        contextDensity,
        apiDelay
      });
    }
  };

  // Helper for density slider mapping
  const densityValues: ContextDensity[] = ['low', 'medium', 'high'];
  const densityIndex = densityValues.indexOf(contextDensity);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-8 text-white">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <LayoutTemplate className="w-8 h-8 text-blue-400" />
          Create Technical Proposal
        </h2>
        <p className="text-slate-400 mt-2">
          Nubiral BSA Team | LATAM | Agentic Workflow v2.0
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Company Info */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Client Company Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Corp, Spotify, Local Bank..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Business Case */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Business Case & Requirements
          </label>
          <textarea
            required
            value={businessCase}
            onChange={(e) => setBusinessCase(e.target.value)}
            placeholder="Describe the problem, the need for fulfillment, or the specific project request. (e.g., We need to migrate our on-prem legacy billing system to a scalable microservices architecture to handle Black Friday traffic)."
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hyperscaler Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              Target HyperScaler
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['AWS', 'Azure', 'GCP', 'OCI'] as HyperScaler[]).map((cloud) => (
                <button
                  key={cloud}
                  type="button"
                  onClick={() => setHyperScaler(cloud)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all
                    ${hyperScaler === cloud
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {cloud}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Languages className="w-4 h-4 text-blue-600" />
              Proposal Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Portuguese">Portuguese</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            Agent Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-500 flex items-center gap-2">
                <Bot className="w-3 h-3 text-purple-600" />
                Reasoning Model (Design & Text)
              </label>
              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Thinking)</option>
                <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Fast)</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-500 flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-pink-600" />
                Image Generation Model
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
                <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro Image (High Quality)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            {/* Context Density Slider */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Information Filtering (Context Density)
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${contextDensity === 'high' ? 'bg-red-100 text-red-600' : contextDensity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {contextDensity}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={densityIndex}
                onChange={(e) => setContextDensity(densityValues[parseInt(e.target.value)])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Low (Summary)</span>
                <span>Medium (Brief)</span>
                <span>High (Detailed)</span>
              </div>
            </div>

            {/* API Rate Limit Delay Slider */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> API Pause (Rate Limit Control)
                </div>
                <span className="text-blue-600 font-mono font-bold">{apiDelay}s</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={apiDelay}
                onChange={(e) => setApiDelay(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Fast (0s)</span>
                <span>Slow (10s)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            Start Agent Workflow
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputStep;