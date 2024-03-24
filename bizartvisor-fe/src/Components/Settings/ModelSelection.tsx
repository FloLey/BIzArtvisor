// ModelSelection.tsx
import React from 'react';

interface ModelSelectionProps {
  selectedModel: string;
  models: string[];
  onModelChange: (model: string) => void;
  useRAG: boolean
  handleCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ selectedModel, models, onModelChange, useRAG, handleCheckboxChange }) => {
  return (
    <div className="section">
      <div className="section-header">Model</div>
      <div className="section-content">
        <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <div className="rag-checkbox">
          <input
            type="checkbox"
            id="useRagCheckbox"
            checked={useRAG}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="useRagCheckbox">Use RAG</label>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
