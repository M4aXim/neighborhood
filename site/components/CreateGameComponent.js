import React, { useEffect, useState, useRef } from 'react';
import DiskBottomBar from './DiskBottomBar';
import PreviewGameBar from './PreviewGameBar';

export default function CreateGameComponent({ onSuccess, onCancel }) {
  const [slackInfo, setSlackInfo] = useState(null);
  const [hackatimeProjects, setHackatimeProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [gameName, setGameName] = useState('');
  const [gameLink, setGameLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef();

  // Fetch Slack info using hacktendoToken
  useEffect(() => {
    const token = localStorage.getItem('hacktendoToken');
    if (!token) return;
    fetch(`/api/getSlackUser?token=${token}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setSlackInfo(data))
      .catch(() => setSlackInfo(null));
  }, []);

  // Fetch Hackatime projects using Slack info
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError('');
      try {
        if (!slackInfo?.slackId || !slackInfo?.email) {
          setError('No Slack ID or email found.');
          setHackatimeProjects([]);
          setLoading(false);
          return;
        }
        // Use Slack ID and email to fetch projects
        const response = await fetch(`/api/getHackatimeProjects?slackId=${slackInfo.slackId}&userId=${slackInfo.userId}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setHackatimeProjects(data.projects || []);
      } catch (err) {
        setError('Could not load Hackatime projects.');
        setHackatimeProjects([]);
      } finally {
        setLoading(false);
      }
    }
    if (slackInfo?.slackId && slackInfo?.userId) fetchProjects();
  }, [slackInfo]);

  const handleProjectToggle = (name) => {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      color: '#000',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10000
    }}>
      <div style={{ width: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => onCancel && onCancel()} style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#eee', cursor: 'pointer' }}>Cancel</button>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Add a Game</h2>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setSubmitError('');
            setSubmitSuccess(false);
            try {
              const token = localStorage.getItem('hacktendoToken');
              if (!token) throw new Error('No token found. Please sign in.');
              let imagesArr = [];
              if (selectedImage) {
                // Upload image to S3 or similar (replace with your upload endpoint)
                const formData = new FormData();
                formData.append('file', selectedImage);
                formData.append('token', token);
                const uploadRes = await fetch('https://express.neighborhood.hackclub.com/upload-icon', {
                  method: 'POST',
                  body: formData,
                });
                if (!uploadRes.ok) throw new Error('Failed to upload image');
                const uploadData = await uploadRes.json();
                imagesArr = [uploadData.url];
              }
              const res = await fetch('/api/createGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token,
                  name: gameName,
                  appLink: gameLink,
                  githubLink,
                  description,
                  images: imagesArr,
                  hackatimeProjects: selectedProjects,
                })
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create game');
              }
              setSubmitSuccess(true);
              setGameName('');
              setGameLink('');
              setGithubLink('');
              setDescription('');
              setSelectedImage(null);
              setSelectedProjects([]);
              if (onSuccess) onSuccess();
            } catch (err) {
              setSubmitError(err.message || 'Failed to submit');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: 700,
            background: '#fff',
            padding: 32,
            borderRadius: 0,
            fontSize: 18,
            maxHeight: '100vh',
            overflowY: 'auto'
          }}
        >
          {slackInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {slackInfo.pfp && <img src={slackInfo.pfp} alt="Slack avatar" style={{ width: 40, height: 40, borderRadius: "8px" }} />}
              <span style={{ fontWeight: 'bold' }}>{slackInfo.slackHandle || slackInfo.fullName}</span>
            </div>
          )}
          {/* Game Cover Upload (2:1 aspect ratio) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>Game Cover Image (2:1 Aspect Ratio):</div>
            <div
              style={{
                width: '100%',
                aspectRatio: '2/1',
                border: '2px dashed #ccc',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                background: '#f5f5f5'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Game cover preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
              ) : (
                <div style={{ color: '#666', textAlign: 'center' }}>
                  Click to upload image
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedImage(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>
          <label style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Game Name:
            <input 
              type="text" 
              value={gameName}
              onChange={e => setGameName(e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: 12, 
                fontSize: 22, 
                padding: '16px 18px', 
                borderRadius: 10, 
                border: '1.5px solid #bbb', 
                background: '#fafbfc', 
                fontWeight: 500,
                outline: 'none',
                transition: 'border 0.2s',
                marginBottom: 16,
              }} 
              onFocus={e => e.target.style.border = '2px solid #4a90e2'}
              onBlur={e => e.target.style.border = '1.5px solid #bbb'}
            />
          </label>
          <label style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Game Link:
            <input 
              type="text" 
              value={gameLink}
              onChange={e => setGameLink(e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: 12, 
                fontSize: 22, 
                padding: '16px 18px', 
                borderRadius: 10, 
                border: '1.5px solid #bbb', 
                background: '#fafbfc', 
                fontWeight: 500,
                outline: 'none',
                transition: 'border 0.2s',
                marginBottom: 16,
              }} 
              onFocus={e => e.target.style.border = '2px solid #4a90e2'}
              onBlur={e => e.target.style.border = '1.5px solid #bbb'}
            />
          </label>
          <label style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            GitHub Link:
            <input 
              type="text" 
              value={githubLink}
              onChange={e => setGithubLink(e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: 12, 
                fontSize: 22, 
                padding: '16px 18px', 
                borderRadius: 10, 
                border: '1.5px solid #bbb', 
                background: '#fafbfc', 
                fontWeight: 500,
                outline: 'none',
                transition: 'border 0.2s',
                marginBottom: 16,
              }} 
              onFocus={e => e.target.style.border = '2px solid #4a90e2'}
              onBlur={e => e.target.style.border = '1.5px solid #bbb'}
            />
          </label>
          <label style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Game Description:
            <textarea 
              rows={4} 
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: 12, 
                fontSize: 20, 
                padding: '16px 18px', 
                borderRadius: 10, 
                border: '1.5px solid #bbb', 
                background: '#fafbfc', 
                fontWeight: 500,
                outline: 'none',
                resize: 'vertical',
                transition: 'border 0.2s',
                marginBottom: 16,
              }}
              onFocus={e => e.target.style.border = '2px solid #4a90e2'}
              onBlur={e => e.target.style.border = '1.5px solid #bbb'}
            />
          </label>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Hackatime Projects:</div>
            {loading && <div>Loading projects...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && !error && hackatimeProjects.length === 0 && <div>No projects found.</div>}
            {!loading && !error && hackatimeProjects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hackatimeProjects.map((project) => (
                  <label key={project.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.name)}
                      onChange={() => handleProjectToggle(project.name)}
                    />
                    <span>{project.name}</span>
                    <span style={{ color: '#888', fontSize: 14 }}>({Math.floor(project.total_seconds / 3600)}h {Math.round((project.total_seconds % 3600) / 60)}m)</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 20,
              padding: '16px 0',
              fontSize: 22,
              fontWeight: 'bold',
              width: '100%',
              background: '#1877F2', // Nintendo blue
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 2px 0 #0f4a92, 0 4px 16px rgba(24,119,242,0.10)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              outline: 'none',
              transition: 'background 0.15s, box-shadow 0.15s',
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseOver={e => e.currentTarget.style.background = '#1456a0'}
            onMouseOut={e => e.currentTarget.style.background = '#1877F2'}
          >
            {submitting ? 'Submitting...' : 'Add to Neighborhood Projects'}
          </button>
          {submitError && <div style={{ color: 'red', marginTop: 12 }}>{submitError}</div>}
          {submitSuccess && <div style={{ color: 'green', marginTop: 12 }}>Game added successfully!</div>}
        </form>
      </div>
    </div>
  );
} 