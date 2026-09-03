import React, { useEffect, useState } from 'react';
import { Image, Plus, Search, Trash2, Upload } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const ImageLibraryManager = () => {
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState('');
  const [label, setLabel] = useState('');
  const [aliases, setAliases] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await adminService.getImageLibrary(search);
      setImages(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load image library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    adminService.checkImageLibraryConnection().then((res) => setConnection(res.data)).catch((err) => setError(err.message));
  }, [search]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || !label.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      await adminService.uploadLibraryImage(imageData, label, aliases.split(',').map((value) => value.trim()));
        setLabel('');
        setAliases('');
        setFile(null);
        event.target.reset();
      await fetchImages();
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Delete this shared image from Cloudinary?')) return;
    try {
      await adminService.deleteLibraryImage(imageId);
      fetchImages();
    } catch (err) {
      setError(err.message || 'Failed to delete image');
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl border border-purple-200 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
        <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center"><Image className="w-5 h-5" /></div>
        <div><h3 className="text-base font-bold text-gray-900">Shared Image Database</h3><p className="text-xs text-gray-500">Upload labeled product images for every store owner</p></div>
      </div>
      {error && <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{error}</div>}
      {connection && <div className={`p-2.5 rounded-xl text-xs font-semibold ${connection.connected ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{connection.message}</div>}
      <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <label className="text-xs font-semibold text-gray-700">Label<input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="atta" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" /></label>
        <label className="text-xs font-semibold text-gray-700">Aliases<input value={aliases} onChange={(event) => setAliases(event.target.value)} placeholder="wheat flour, chakki atta" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" /></label>
        <label className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold cursor-pointer text-center"><Upload className="w-3.5 h-3.5 inline mr-1" />{file ? file.name : 'Choose image'}<input type="file" accept="image/*" required className="hidden" onChange={(event) => setFile(event.target.files[0])} /></label>
        <button type="submit" disabled={submitting || !file} className="sm:col-span-3 justify-self-end px-3 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Plus className="w-3.5 h-3.5" />{submitting ? 'Uploading...' : 'Add to Image Database'}</button>
      </form>
      <div className="relative"><Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search labels..." className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-none" /></div>
      {loading ? <p className="py-6 text-center text-xs text-gray-400">Loading image library...</p> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{images.map((image) => <div key={image._id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"><img src={image.imageUrl} alt={image.label} className="w-full aspect-square object-cover" /><div className="p-2 flex items-center justify-between gap-1"><span className="text-xs font-bold truncate">{image.label}</span><button onClick={() => handleDelete(image._id)} className="p-1 text-red-500" title="Delete image"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}</div>}
    </section>
  );
};
