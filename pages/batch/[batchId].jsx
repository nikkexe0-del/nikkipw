import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getCurrentApiUrl,
  getBatches,
  fetchAllBatchContent,
  getVideoDetails,
  buildVideoUrl,
  getLiveClasses,
  getPreviousLiveClasses,
} from '../../src/services/apiService';

// ──────────────────────────────────────────────
// Sub-components (inline for single-file page)
// ──────────────────────────────────────────────

const IconFolder = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconPdf = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const Shimmer = ({ h = 60, r = 12 }) => (
  <div className="shimmer" style={{ height: h, borderRadius: r, border: '1px solid rgba(255,255,255,0.04)' }} />
);

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const BatchDetailPage = () => {
  const router = useRouter();
  const { batchId } = router.query;

  const [batch, setBatch] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loadingItem, setLoadingItem] = useState(null);

  // PDF Modal
  const [pdfModal, setPdfModal] = useState({ open: false, url: '', title: '' });

  // Live
  const [liveSubTab, setLiveSubTab] = useState('live');
  const [liveClasses, setLiveClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [previousLiveClasses, setPreviousLiveClasses] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    if (batchId) loadBatchData();
  }, [batchId]);

  const loadBatchData = async () => {
    try {
      setLoading(true);
      setError('');
      const apiUrl = await getCurrentApiUrl();
      if (!apiUrl) { setError('Server temporarily down.'); return; }

      const batchesRes = await getBatches();
      const batches = batchesRes.data || batchesRes || [];
      const found = batches.find(b => String(b.id) === String(batchId));
      if (!found) { setError('Batch not found.'); return; }
      setBatch(found);

      const batchContent = await fetchAllBatchContent(batchId);
      setContent(batchContent);
    } catch (e) {
      console.error(e);
      setError('Server temporarily down. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (video) => {
    try {
      setLoadingItem(video.id);
      const videoDetails = await getVideoDetails(video.id, batchId);
      const data = videoDetails.data || videoDetails;
      const videoUrl = data.video_url || data.url || data.stream_url || data.video_player_url || data.player_url;
      const token = data.video_player_token || data.token || data.video_token || data.access_token;
      if (!videoUrl) { setError('Video not available.'); return; }
      let finalUrl = videoUrl;
      if (token) finalUrl = buildVideoUrl(videoUrl, token);
      window.open(finalUrl, '_blank');
    } catch (e) {
      setError('Video not available. Please try again.');
    } finally {
      setLoadingItem(null);
    }
  };

  const handlePdfClick = async (pdf) => {
    try {
      setLoadingItem(pdf.id);
      let pdfLink = pdf.file_link || pdf.pdf_link || pdf.download_link || pdf.attachment_link || pdf.url || pdf.link || pdf.file_url || pdf.pdf_url;
      if (!pdfLink) { setError('PDF link not available.'); return; }
      if (!pdfLink.startsWith('http')) {
        const res = await fetch('/api/pdf-decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encrypted_link: pdfLink, pdf_id: pdf.id }),
        });
        const data = await res.json();
        if (!data.success || !data.decrypted_url) throw new Error('Decryption failed');
        pdfLink = data.decrypted_url;
      }
      const viewerUrl = `https://pdfweb.classx.co.in/pdfjs/web/viewer-new.html?file=${encodeURIComponent(pdfLink)}`;
      setPdfModal({ open: true, url: viewerUrl, title: pdf.Title || pdf.title || 'Document' });
    } catch (e) {
      setError('Unable to open PDF. Please try again.');
    } finally {
      setLoadingItem(null);
    }
  };

  const handleFolderClick = (folder) => {
    setBreadcrumbs([...breadcrumbs, { id: folder.id, title: folder.Title || folder.title }]);
    setCurrentFolder(folder.id);
  };

  const handleBreadcrumb = (idx) => {
    if (idx === -1) { setBreadcrumbs([]); setCurrentFolder(null); }
    else {
      const nb = breadcrumbs.slice(0, idx + 1);
      setBreadcrumbs(nb);
      setCurrentFolder(nb[nb.length - 1].id);
    }
  };

  const loadLiveClasses = async () => {
    if (liveClasses.length > 0 || upcomingClasses.length > 0) return;
    try {
      setLoadingLive(true);
      const res = await getLiveClasses(batchId);
      setLiveClasses(res.live || res.data?.live || []);
      setUpcomingClasses(res.upcoming || res.data?.upcoming || []);
    } catch (e) { console.error(e); }
    finally { setLoadingLive(false); }
  };

  const loadPreviousLive = async () => {
    if (previousLiveClasses.length > 0) return;
    try {
      setLoadingLive(true);
      const res = await getPreviousLiveClasses(batchId);
      setPreviousLiveClasses(res.data || res || []);
    } catch (e) { console.error(e); }
    finally { setLoadingLive(false); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'live') loadLiveClasses();
  };

  const handleLiveSubTab = (sub) => {
    setLiveSubTab(sub);
    if (sub === 'previous') loadPreviousLive();
  };

  const getCurrentContent = () => {
    if (!content.length) return [];
    if (!currentFolder) {
      return content.filter(item => !content.some(p => p.material_type === 'FOLDER' && String(p.id) === String(item.parent_id)));
    }
    return content.filter(item => String(item.parent_id) === String(currentFolder));
  };

  const currentContent = getCurrentContent();
  const folders = currentContent.filter(i => i.material_type === 'FOLDER');
  const videos  = currentContent.filter(i => i.material_type === 'VIDEO');
  const pdfs    = currentContent.filter(i => i.material_type === 'PDF');

  // ─── LOADING ───
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080c12' }}>
        {/* Navbar placeholder */}
        <div style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,18,0.9)' }} />
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px' }}>
          <div className="shimmer" style={{ height: 32, width: 250, borderRadius: 8, marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <div className="shimmer" style={{ height: 38, width: 100, borderRadius: 20 }} />
            <div className="shimmer" style={{ height: 38, width: 140, borderRadius: 20 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => <Shimmer key={i} h={80} />)}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ───
  return (
    <div style={{ minHeight: '100vh', background: '#080c12' }}>

      {/* PDF Modal */}
      {pdfModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: '#0d1421',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>
              📄 {pdfModal.title}
            </span>
            <button
              onClick={() => setPdfModal({ open: false, url: '', title: '' })}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              ✕ Close
            </button>
          </div>
          <iframe src={pdfModal.url} style={{ flex: 1, border: 'none' }} title={pdfModal.title} />
        </div>
      )}

      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(8,12,18,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '16px' }}>
            {/* Back */}
            <Link href="/" style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              <IconBack /> Back
            </Link>
            
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '14px', color: '#000',
              }}>S</div>
              <span style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Science & Fun
              </span>
            </Link>

            <div style={{ flex: 1 }} />

            {/* WhatsApp pill */}
            <a
              href="https://whatsapp.com/channel/0029Va9TLtJDp2132QkGU53z"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px',
                background: 'rgba(37,211,102,0.1)',
                border: '1px solid rgba(37,211,102,0.2)',
                borderRadius: '8px',
                color: '#25d366',
                textDecoration: 'none',
                fontSize: '12px', fontWeight: 600, flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join Channel
            </a>
          </div>
        </div>
      </div>

      {/* Batch hero */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 20px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(20px, 3vw, 32px)',
            color: '#f1f5f9',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}>
            {batch?.course_name || batch?.name || 'Course Content'}
          </h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'content', label: '📚 Content' },
              { key: 'live', label: '🔴 Live & Upcoming' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '100px',
                  border: activeTab === key ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: activeTab === key ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === key ? '#f59e0b' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.01em',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          maxWidth: '1280px', margin: '16px auto', padding: '0 20px',
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>😔 {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>

        {/* ── CONTENT TAB ── */}
        {activeTab === 'content' && (
          <div>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleBreadcrumb(-1)}
                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  🏠 Home
                </button>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    <span style={{ color: '#334155' }}>/</span>
                    <button
                      onClick={() => handleBreadcrumb(idx)}
                      style={{
                        background: 'none', border: 'none',
                        color: idx === breadcrumbs.length - 1 ? '#f1f5f9' : '#f59e0b',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      }}
                    >
                      {crumb.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Stats bar */}
            {currentContent.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {folders.length > 0 && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{folders.length}</span> Folders
                  </span>
                )}
                {videos.length > 0 && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>{videos.length}</span> Videos
                  </span>
                )}
                {pdfs.length > 0 && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>{pdfs.length}</span> PDFs
                  </span>
                )}
              </div>
            )}

            {/* Empty state */}
            {currentContent.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ color: '#475569', fontSize: '15px' }}>No content found in this folder.</p>
              </div>
            )}

            {/* Folders */}
            {folders.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Folders
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      style={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        color: '#f1f5f9',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)';
                        e.currentTarget.style.background = '#1a2332';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = '#111827';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                        <IconFolder />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {folder.Title || folder.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Folder</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Videos
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {videos.map((video, idx) => (
                    <button
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      disabled={loadingItem === video.id}
                      style={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        opacity: loadingItem === video.id ? 0.7 : 1,
                        width: '100%',
                      }}
                      onMouseEnter={e => {
                        if (loadingItem !== video.id) {
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                          e.currentTarget.style.background = '#1a2332';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = '#111827';
                      }}
                    >
                      {/* Number */}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      {/* Icon */}
                      <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                        <IconVideo />
                      </div>
                      {/* Title */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {video.Title || video.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Video Lecture</div>
                      </div>
                      {/* Play button */}
                      <div style={{
                        width: '32px', height: '32px',
                        background: loadingItem === video.id ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#3b82f6', flexShrink: 0,
                      }}>
                        {loadingItem === video.id
                          ? <div style={{ width: 14, height: 14, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          : <IconPlay />
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDFs */}
            {pdfs.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Study Material (PDFs)
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pdfs.map((pdf, idx) => (
                    <button
                      key={pdf.id}
                      onClick={() => handlePdfClick(pdf)}
                      disabled={loadingItem === pdf.id}
                      style={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        opacity: loadingItem === pdf.id ? 0.7 : 1,
                        width: '100%',
                      }}
                      onMouseEnter={e => {
                        if (loadingItem !== pdf.id) {
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                          e.currentTarget.style.background = '#1a2332';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = '#111827';
                      }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div style={{ width: '36px', height: '36px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                        <IconPdf />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pdf.Title || pdf.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>PDF / E-Book</div>
                      </div>
                      <div style={{
                        width: '32px', height: '32px',
                        background: 'rgba(239,68,68,0.1)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444', flexShrink: 0, fontSize: '14px',
                      }}>
                        {loadingItem === pdf.id
                          ? <div style={{ width: 14, height: 14, border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          : '→'
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIVE TAB ── */}
        {activeTab === 'live' && (
          <div>
            {/* Sub tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { key: 'live', label: '🔴 Live & Upcoming' },
                { key: 'previous', label: '📹 Previous Classes' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleLiveSubTab(key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    border: liveSubTab === key ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    background: liveSubTab === key ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                    color: liveSubTab === key ? '#ef4444' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {loadingLive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(4)].map((_, i) => <Shimmer key={i} h={80} />)}
              </div>
            )}

            {!loadingLive && liveSubTab === 'live' && (
              <div>
                {liveClasses.length === 0 && upcomingClasses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📡</div>
                    <p style={{ color: '#475569' }}>No live or upcoming classes at the moment.</p>
                  </div>
                ) : (
                  <>
                    {liveClasses.map(cls => (
                      <div key={cls.id} style={{
                        background: '#111827',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} className="live-dot" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{cls.topic || cls.title || 'Live Class'}</div>
                          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px', fontWeight: 600 }}>🔴 LIVE NOW</div>
                        </div>
                        <button onClick={() => handleVideoClick(cls)} className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px' }}>
                          Watch
                        </button>
                      </div>
                    ))}
                    {upcomingClasses.map(cls => (
                      <div key={cls.id} style={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🗓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{cls.topic || cls.title || 'Upcoming Class'}</div>
                          <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '2px', fontWeight: 600 }}>Upcoming</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {!loadingLive && liveSubTab === 'previous' && (
              <div>
                {previousLiveClasses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: '#475569' }}>No previous classes available.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {previousLiveClasses.map((cls, idx) => (
                      <button
                        key={cls.id}
                        onClick={() => handleVideoClick(cls)}
                        disabled={loadingItem === cls.id}
                        style={{
                          background: '#111827',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          width: '100%',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'; e.currentTarget.style.background = '#1a2332'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#111827'; }}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cls.topic || cls.title || `Class ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Previous Live Class</div>
                        </div>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                          {loadingItem === cls.id
                            ? <div style={{ width: 14, height: 14, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            : <IconPlay />
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
      `}</style>
    </div>
  );
};

export default BatchDetailPage;
