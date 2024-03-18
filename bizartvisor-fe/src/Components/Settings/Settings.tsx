import React, { useEffect, useState } from 'react';
import { fetchModelNames } from '../../API/api';
import './Settings.scss';

const Settings: React.FC<{
    selectedModel: string;
    setSelectedModel: (model: string) => void;
  }> = ({ selectedModel, setSelectedModel }) => {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    const initializeModels = async () => {
      try {
        const fetchedModels = await fetchModelNames();
        setModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0]); // Set the first model as the default
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    initializeModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  return (
    <div className="settings-container">
        Model:
      <select value={selectedModel} onChange={handleModelChange}>
        {models.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
    </div>
  );
}
export default Settings;
