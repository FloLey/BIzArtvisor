// ModelSelection.tsx
import React from 'react';

interface ModelSelectionProps {
  selectedModel: string;
  models: string[];
  onModelChange: (model: string) => void;
  useRAG: boolean
  handleRagCheckbox: (event: React.ChangeEvent<HTMLInputElement>) => void;
  useNewsTool: boolean
  handleNewsToolCheckBox: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ selectedModel, models, onModelChange, useRAG, handleRagCheckbox, useNewsTool, handleNewsToolCheckBox }) => {
  return (
    <div className="section">
      <div className="section-header">Model</div>
      <div className="section-content">
        <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <div className="checkbox">
          <input
            type="checkbox"
            id="useRagCheckbox"
            checked={useRAG}
            onChange={handleRagCheckbox}
          />
          <label htmlFor="useRagCheckbox">Use RAG</label>
          </div>
          <div className="checkbox">
          <input
            type="checkbox"
            id="useNewsTool"
            checked={useNewsTool}
            onChange={handleNewsToolCheckBox}
          />
          <label htmlFor="useNewsTool">Use News tool</label>
          </div>
      </div>
    </div>
  );
};

export default ModelSelection;
