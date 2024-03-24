// Settings.tsx
import React, { useEffect, useState } from 'react';
import { fetchModelNames } from '../../API/api';
import './Settings.scss';
import ModelSelection from './ModelSelection';
import KnowledgeAddition from './KnowledgeAddition';

interface SettingsProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useRAG: boolean
  handleCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Settings: React.FC<SettingsProps> = ({ selectedModel, setSelectedModel, useRAG, handleCheckboxChange }) => {
  const [models, setModels] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const initializeModels = async () => {
      try {
        const fetchedModels = await fetchModelNames();
        setModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0]);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    initializeModels();
  }, [setSelectedModel]);

  const handleUploadSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(''); // Clear any previous error message
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000); // Hide the success message after 3 seconds
  };

  const handleUploadError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(''); // Clear any previous success message
    setTimeout(() => {
      setErrorMessage('');
    }, 3000); // Hide the error message after 3 seconds
  };

  const SuccessPopup: React.FC<{ message: string }> = ({ message }) => {
    return <div className="popup success">{message}</div>;
  };
  
  const ErrorPopup: React.FC<{ message: string }> = ({ message }) => {
    return <div className="popup error">{message}</div>;
  };
  

  return (
    <div className="settings-container">
      <ModelSelection
        selectedModel={selectedModel}
        models={models}
        onModelChange={setSelectedModel}
        useRAG={useRAG}
        handleCheckboxChange={handleCheckboxChange}
      />
      <KnowledgeAddition
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      {successMessage && <SuccessPopup message={successMessage} />}
      {errorMessage && <ErrorPopup message={errorMessage} />}
    </div>
  );
};

export default Settings;
