import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const DownloadPage = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [progressInterval, setProgressInterval] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleSearch = async () => {
    if (!query) return alert("Please enter a search term!");
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/search`, { params: { query } });
      setVideos(response.data);
      setError("");
    } catch (err) {
      console.error("Search Error:", err);
      setError("Failed to fetch videos. Try again!");
    } finally {
      setLoading(false);
    }
  };

  // const handleDownload = async (video) => {
  //   const quality = "720p";
  //   setLoading(true);
  //   try {
  //     console.log("📥 Downloading:", video.title, selectedFormat, quality);

  //     const response = await axios({
  //       method: "GET",
  //       url: `${backendUrl}/download`,
  //       params: { videoId: video.videoId, format: selectedFormat, quality },
  //       responseType: "blob",
  //     });

  //     console.log("✅ Download Complete!");
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", `${video.title}.${selectedFormat}`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   } catch (error) {
  //     console.error("❌ Download Error:", error);
  //     setError("Failed to download video.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDownload = async (video) => {
    setLoading(true);
    setDownloadProgress(0);
    setError('');
    setDownloadPhase('fetching'); // New state for tracking download phase
  
    // First show fetching message for 1.5 seconds
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloadPhase('downloading');
  
    // Set different speeds based on format
    const intervalSpeed = selectedFormat === "mp3" ? 500 : 2200;
    const incrementSize = selectedFormat === "mp3" ? 10 : 2;
  
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev < 90) {
          return prev + Math.random() * incrementSize;
        }
        if (prev >= 90 && prev < 100) {
          setDownloadPhase('finalizing');
        }
        return prev;
      });
    }, intervalSpeed);
  
    setProgressInterval(interval);
  
    try {
      const response = await axios({
        method: "GET",
        url: `${backendUrl}/download`,
        params: { videoId: video.videoId, format: selectedFormat },
        responseType: "blob"
      });
  
      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloadPhase('complete');
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${video.title}.${selectedFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      setTimeout(() => setLoading(false), 1000);
  
    } catch (error) {
      console.error("Download Error:", error);
      clearInterval(progressInterval);
      setError("Failed to download video.");
      setLoading(false);
    }
  };
  
  // Add this state near your other useState declarations
  const [downloadPhase, setDownloadPhase] = useState('fetching'); // 'fetching', 'downloading', 'finalizing', 'complete'
  
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      {/* {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-md z-50">
          <div className="relative">
            <div className="w-20 h-20 sm:w-32 sm:h-32 border-8 border-transparent border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl font-semibold animate-pulse">Loading...</span>
            </div>
          </div>
        </div>
      )} */}
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
          className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
            selectedFormat === "mp3" ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${downloadProgress}%` }}
        ></div>
      </div>
      
      {/* Phase-specific messages */}
      <div className="text-center text-sm text-gray-300 mb-2">
        {downloadPhase === 'fetching' && 'Please wait Fetching video from YouTube...'}
        {downloadPhase === 'downloading' && `Download progress: ${Math.round(downloadProgress)}%`}
        {downloadPhase === 'finalizing' && 'Almost done! Finalizing your download...'}
        {downloadPhase === 'complete' && 'Your file is ready!'}
      </div>
      
      {/* Special message at 90% */}
      {downloadProgress >= 90 && downloadProgress < 100 && (
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

      <div className="pt-24 px-4 sm:px-6 flex flex-col items-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">YouTube Video Downloader</h1>
        <div className="flex flex-col sm:flex-row items-stretch w-full max-w-xl gap-2 mb-8">
          <input
            type="text"
            placeholder="Search YouTube videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-grow p-3 rounded-lg sm:rounded-l-lg bg-gray-800 text-white outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-r-lg transition w-full sm:w-auto"
          >
            Search
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl px-2">
          {videos.map((video) => (
            <div key={video.videoId} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col">
              <img src={video.thumbnail} alt={video.title} className="rounded-lg mb-4 w-full h-auto object-cover" />
              <h2 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2">{video.title}</h2>
              <p className="text-sm text-gray-400 truncate">{video.channelTitle}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <button
                  onClick={() => setSelectedFormat("mp3")}
                  className={`px-3 py-2 rounded text-sm ${selectedFormat === "mp3" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-700"}`}
                >
                  MP3
                </button>
                <button
                  onClick={() => setSelectedFormat("mp4")}
                  className={`px-3 py-2 rounded text-sm ${selectedFormat === "mp4" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-700"}`}
                >
                  MP4
                </button>
                <button
                  onClick={() => handleDownload(video)}
                  className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded text-sm"
                >
                  📥 Download
                </button>
                <button
                  onClick={() => {
                    setPlayingVideo(video.videoId);
                    setShowPlayModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded text-sm"
                >
                  ▶ Play
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPlayModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4">
          <div className="bg-gray-800 p-4 rounded-lg w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              onClick={() => setShowPlayModal(false)}
            >
              X
            </button>
            <div className="w-full aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playingVideo}`}
                frameBorder="0"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadPage;
