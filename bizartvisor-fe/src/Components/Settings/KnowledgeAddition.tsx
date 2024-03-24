import React, { useEffect, useState } from 'react';
import { fetchTextSplittersNames, uploadFile } from '../../API/api';

interface KnowledgeAdditionProps {
  onUploadSuccess: (message: string) => void; // Callback for successful upload
  onUploadError: (error: string) => void; // Callback for upload error
}

const KnowledgeAddition: React.FC<KnowledgeAdditionProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [textSplitters, setTextSplitters] = useState<string[]>(['None']);
  const [selectedTextSplitter, setSelectedTextSplitter] = useState<string>('None');
  const [splitterArgs, setSplitterArgs] = useState({
    chunk_size: '',
    chunk_overlap: '',
    number_of_chunks: '',
  });
  const [context, setContext]= useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null); // Added state for file path
  const [isUploading, setIsUploading] = useState<boolean>(false); // Added state for upload progress


  useEffect(() => {
    const initializeTextSplitters = async () => {
      try {
        const fetchedTextSplitters = await fetchTextSplittersNames();
        setTextSplitters([...fetchedTextSplitters]);
      } catch (error) {
        console.error('Error fetching text splitters:', error);
      }
    };

    initializeTextSplitters();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setFilePath(files[0].name);
    } else {
      setFile(null);
      setFilePath(null);
    }
  };

  const handleUpload = async () => {
    console.log("test")
    if (!file) return;
    setIsUploading(true); // Indicate upload is starting
    const formData = new FormData();
    formData.append('file', file);
    formData.append('splitter', selectedTextSplitter !== 'None' ? selectedTextSplitter : '');
    formData.append('context', context);
    formData.append('splitter_args', JSON.stringify(splitterArgs));

    try {
      await uploadFile(formData);
      onUploadSuccess('Upload successful!');
    } catch (error) {
      onUploadError('Error uploading file');
    } finally {
      setIsUploading(false); // Reset upload state regardless of outcome
    }
  };

  const handleSplitterArgChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.target as HTMLInputElement;
    setSplitterArgs(prevArgs => ({ ...prevArgs, [name]: value }));
  };

  const handleContextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(event.target.value); // Update the context state with the new value
  };

  
  const renderSplitterArgsInputs = () => {
    switch (selectedTextSplitter) {
      case 'recursive_character':
        return (
          <>
            <input
              type="number"
              name="chunk_size"
              value={splitterArgs.chunk_size}
              onChange={handleSplitterArgChange}
              placeholder="Chunk Size"
            />
            <input
              type="number"
              name="chunk_overlap"
              value={splitterArgs.chunk_overlap}
              onChange={handleSplitterArgChange}
              placeholder="Chunk Overlap"
            />
          </>
        );
      case 'semantic_chunker':
        return (
          <>
            <input
              type="number"
              name="number_of_chunks"
              value={splitterArgs.number_of_chunks}
              onChange={handleSplitterArgChange}
              placeholder="Number of Chunks"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="section">
      <div className="section-header">Add to Knowledge</div>
      <div className="section-content">
        <select
          value={selectedTextSplitter}
          onChange={(e) => setSelectedTextSplitter(e.target.value)}
        >
          {textSplitters.map((splitter, index) => (
            <option key={index} value={splitter}>{splitter}</option>
          ))}
        </select>
        <textarea
          name="context"
          value={context}
          onChange={handleContextChange}
          placeholder="Additional context"
          className="additional-context-input"
          // Other necessary props
        />
        {renderSplitterArgsInputs()}
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          style={{ display: 'none' }} // Hide the default file input
        />
        <label htmlFor="fileInput" className="file-input-label">
          <span className="file-input-text">{filePath || "Choose File"}</span>
        </label>
        <button onClick={handleUpload} disabled={!file || isUploading} className="upload-btn">
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
    </div>
  );
};

export default KnowledgeAddition;
