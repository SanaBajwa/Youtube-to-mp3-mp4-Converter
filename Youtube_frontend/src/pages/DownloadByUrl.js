import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const DownloadByUrl = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [downloadPhase, setDownloadPhase] = useState("fetching"); // 'fetching', 'downloading', 'finalizing', 'complete'

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Clean up interval on unmount
  const [progressInterval, setProgressInterval] = useState(null);
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  const handleFetchVideo = async () => {
    if (!searchQuery) {
      alert("Please enter a YouTube URL!");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    try {
      const response = await axios.get(`${backendUrl}/preview`, {
        params: { url: searchQuery },
      });

      if (response.status !== 200 || !response.data) {
        throw new Error("Invalid response from the backend.");
      }

      setVideo(response.data);
    } catch (error) {
      console.error("Preview Fetch Error:", error);
      setError("Error fetching video info. Ensure the URL is correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (videoId) => {
    if (!videoId) {
      setError("Invalid video ID.");
      return;
    }
  
    setLoading(true);
    setProgress(0);
    setError("");
    setDownloadPhase("fetching");
  
    // First show fetching message for 1-2 seconds
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloadPhase("downloading");
  
    // Set different intervals based on format
    const intervalSpeed = selectedFormat === "mp3" ? 500 : 1500;
    const incrementSize = selectedFormat === "mp3" ? 10 : 5;
    
    // Start progress animation with format-specific speed
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return Math.min(90, prev + Math.random() * incrementSize);
        }
        if (prev >= 90 && prev < 100) {
          setDownloadPhase("finalizing");
        }
        return prev;
      });
    }, intervalSpeed);
  
    setProgressInterval(interval);
  
    try {
      const response = await axios({
        method: "GET",
        url: `${backendUrl}/download`,
        params: { videoId, format: selectedFormat },
        responseType: "blob"
      });
  
      // Download complete - jump to 100%
      clearInterval(interval);
      setProgress(100);
      setDownloadPhase("complete");
  
      // Create download link
      const blob = new Blob([response.data], {
        type: selectedFormat === "mp3" ? "audio/mpeg" : "video/mp4"
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
  
      link.href = downloadUrl;
      link.setAttribute("download", `${video?.title || "video"}.${selectedFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(downloadUrl);
  
    } catch (error) {
      console.error("Download Error:", error);
      clearInterval(progressInterval);
      setError("Error downloading video. Please try again.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="relative bg-gray-900 text-white min-h-screen flex flex-col items-center px-4 sm:px-6 md:px-8">
      <Navbar />

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            {/* Phase-specific title */}
            <h3 className="text-xl font-semibold mb-4">
              {downloadPhase === 'fetching' && `Fetching ${selectedFormat.toUpperCase()} from YouTube...`}
              {downloadPhase === 'downloading' && `Downloading ${selectedFormat.toUpperCase()}...`}
              {downloadPhase === 'finalizing' && `Preparing your ${selectedFormat.toUpperCase()}...`}
              {downloadPhase === 'complete' && 'Download complete!'}
            </h3>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  selectedFormat === "mp3" ? "bg-green-500" : "bg-blue-500"
                }`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Phase-specific messages */}
            <div className="text-center text-sm text-gray-300 mb-2">
              {downloadPhase === 'fetching' && 'Please wait while we connect to YouTube...'}
              {downloadPhase === 'downloading' && `Download progress: ${Math.round(progress)}%`}
              {downloadPhase === 'finalizing' && 'Almost done! Finalizing your download...'}
              {downloadPhase === 'complete' && 'Your file is ready!'}
            </div>
            
            {/* Special message at 90% */}
            {progress >= 90 && progress < 100 && (
              <div className="text-center text-yellow-400 text-sm mt-2 animate-pulse">
                Please wait! Your {selectedFormat.toUpperCase()} is about to download...
              </div>
            )}
            
            {/* Completion indicator */}
            {downloadPhase === 'complete' && (
              <div className="text-center text-green-400 text-sm mt-2">
                File will download automatically...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-28 w-full max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">YouTube Video Downloader</h1>

        {/* URL Input */}
        <div className="flex flex-col sm:flex-row items-stretch w-full max-w-xl gap-2 mb-8">
          <input
            type="text"
            placeholder="Enter YouTube URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetchVideo()}
            className="flex-grow p-3 rounded-lg sm:rounded-l-lg bg-gray-800 text-white outline-none"
          />
          <button
            onClick={handleFetchVideo}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-r-lg transition w-full sm:w-auto"
          >
            Fetch Video
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Video Preview */}
        {video && (
          <div className="bg-gray-800 p-4 rounded-lg w-full shadow-lg">
            <img src={video.thumbnail} alt={video.title} className="w-full rounded-md" />
            <h2 className="mt-4 font-semibold text-lg">{video.title}</h2>

            {/* Format Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button
                onClick={() => setSelectedFormat("mp3")}
                className={`px-4 py-2 rounded-lg transition ${selectedFormat === "mp3" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-700"}`}
              >
                MP3
              </button>
              <button
                onClick={() => setSelectedFormat("mp4")}
                className={`px-4 py-2 rounded-lg transition ${selectedFormat === "mp4" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-700"}`}
              >
                MP4
              </button>
              <button
                onClick={() => handleDownload(video.videoId)}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                📥 Download
              </button>
              <button
                onClick={() => {
                  setPlayingVideo(video.videoId);
                  setShowPlayModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
              >
                ▶ Play
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showPlayModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4">
          <div className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full relative">
            <button
              className="absolute top-2 right-2 text-white bg-red-600 px-3 py-1 rounded"
              onClick={() => setShowPlayModal(false)}
            >
              ✕
            </button>
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${playingVideo}`}
              frameBorder="0"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadByUrl;