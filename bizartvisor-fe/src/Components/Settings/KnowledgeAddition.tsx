import React, { useEffect, useState } from 'react';
import { fetchTextSplittersNames, uploadFile, uploadWebsite } from '../../API/api';

interface KnowledgeAdditionProps {
  onUploadSuccess: (message: string) => void; // Callback for successful upload
  onUploadError: (error: string) => void; // Callback for upload error
}

interface WebsiteUploadDetails {
  websiteUrl: string;
  depth: number;
  maxLinks: number;
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
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null); // Added state for file path

  const [websiteUploadDetails, setWebsiteUploadDetails] = useState<WebsiteUploadDetails>({
    websiteUrl: '',
    depth: 2,
    maxLinks: 50,
  });

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
    setIsUploading(true);

    try {
      const formData = new FormData();
      if (uploadType === 'file') {
        if (!file) throw new Error('No file selected');
        formData.append('file', file);
      } else {
        const { websiteUrl, depth, maxLinks } = websiteUploadDetails;
        if (!websiteUrl) throw new Error('Website URL is required');
        formData.append('website_url', websiteUrl);
        formData.append('depth', depth.toString());
        formData.append('max_links', maxLinks.toString());
      }

      formData.append('splitter', selectedTextSplitter !== 'None' ? selectedTextSplitter : '');
      formData.append('context', context);
      formData.append('splitter_args', JSON.stringify(splitterArgs));

      let apiResponse;
      if (uploadType === 'file') {
        apiResponse = await uploadFile(formData);
      } else {
        apiResponse = await uploadWebsite(formData); // Ensure this function is implemented and imported
      }
      const responseMessage = apiResponse.message;

      onUploadSuccess(responseMessage); // Call the success callback with the API response message
    } catch (error) {
      // Assuming error is an instance of Error
      onUploadError(error instanceof Error ? error.message : 'Error uploading');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSplitterArgChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.target as HTMLInputElement;
    setSplitterArgs(prevArgs => ({ ...prevArgs, [name]: value }));
  };

  const handleContextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(event.target.value); // Update the context state with the new value
  };

  const handleWebsiteDetailChange = (key: keyof WebsiteUploadDetails, value: string | number) => {
    setWebsiteUploadDetails(prevDetails => ({
      ...prevDetails,
      [key]: value,
    }));
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
        />
        {renderSplitterArgsInputs()}
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as 'file' | 'url')}
          className="upload-type-selector"
        >
          <option value="file">File</option>
          <option value="url">URL</option>
        </select>
        {uploadType === 'file' && (
        <>
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="fileInput" className="file-input-label">
            <span className="file-input-text">{filePath || "Choose File"}</span>
          </label>
          <button onClick={handleUpload} disabled={!file || isUploading} className="upload-btn">
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </>
        )}
        {uploadType === 'url' && (
        <>
          <input
            type="text"
            placeholder="Website URL"
            value={websiteUploadDetails.websiteUrl}
            onChange={(e) => handleWebsiteDetailChange('websiteUrl', e.target.value)}
          />
          <input
            type="number"
            placeholder="Depth"
            value={websiteUploadDetails.depth}
            onChange={(e) => handleWebsiteDetailChange('depth', parseInt(e.target.value))}
          />
          <input
            type="number"
            placeholder="Max Links"
            value={websiteUploadDetails.maxLinks}
            onChange={(e) => handleWebsiteDetailChange('maxLinks', parseInt(e.target.value))}
          />
          <button onClick={handleUpload} disabled={!websiteUploadDetails.websiteUrl || isUploading} className="upload-btn">
            {isUploading ? 'Uploading...' : 'Upload Website'}
          </button>
        </>
      )}
      </div>
    </div>
  );
};

export default KnowledgeAddition