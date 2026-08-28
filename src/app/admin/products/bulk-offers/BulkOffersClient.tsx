'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { adminFetch, AdminApiError } from '@/lib/admin-api';
import { PageHeader, AdminButton, useToast } from '@/components/admin/ui';
import { FiDownload, FiUpload } from 'react-icons/fi';
import Papa from 'papaparse';

export default function BulkOffersClient() {
  const { show, Toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await adminFetch<{ products: any[] }>('/api/products?all=1');
      const products = res.products || [];
      const records: any[] = [];
      
      for (const p of products) {
        if (p.offers && p.offers.length > 0) {
          for (const offer of p.offers) {
            records.push({ slug: p.slug, name: p.name, offer_title: offer.title || '', offer_description: offer.description || '', offer_code: offer.code || '' });
          }
        } else {
          records.push({ slug: p.slug, name: p.name, offer_title: '', offer_description: '', offer_code: '' });
        }
      }
      
      const csv = Papa.unparse(records);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'products_offers_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      show('Template downloaded');
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : 'Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productOffers = new Map<string, any[]>();
          for (const r of results.data as any[]) {
            const slug = r.slug;
            if (!slug) continue;
            
            const title = (r.offer_title || '').trim();
            const description = (r.offer_description || '').trim();
            const code = (r.offer_code || '').trim();
            
            if (!productOffers.has(slug)) {
              productOffers.set(slug, []);
            }
            if (title || description || code) {
              productOffers.get(slug)!.push({ title, description, code });
            }
          }
          
          const updates = Array.from(productOffers.entries()).map(([slug, offers]) => ({ slug, offers }));
          
          const res = await adminFetch<{ updated: number }>('/api/products/bulk-offers/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates }),
          });
          show(`Successfully updated offers for ${res.updated} products!`, 'success');
        } catch (err: any) {
          show(err.message || 'Upload failed', 'error');
        } finally {
          setUploading(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      },
      error: (err) => {
        show(`CSV Parse Error: ${err.message}`, 'error');
        setUploading(false);
      }
    });
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title='Bulk Offers'
        subtitle='Download the CSV template, fill in offer details, and upload to update multiple products at once.'
        actions={
          <Link href='/admin/products'>
            <AdminButton variant='secondary'>Back to products</AdminButton>
          </Link>
        }
      />
      <div className='max-w-2xl bg-white border border-[var(--color-border)] rounded-xl p-6'>
        <div className='mb-8 pb-8 border-b border-[var(--color-border)]'>
          <h2 className='text-base font-semibold mb-2'>1. Download Template</h2>
          <p className='text-[13px] text-neutral-500 mb-4'>
            Get a CSV file containing all your current products. The file includes columns for <strong>offer_title</strong>, <strong>offer_description</strong>, and <strong>offer_code</strong>. If you leave these blank for a product, its offers will be cleared. If you want multiple offers for the same product, just duplicate the row for that product!
          </p>
          <AdminButton onClick={handleDownload} disabled={downloading}>
            <FiDownload className='inline-block mr-2' />
            {downloading ? 'Preparing CSV...' : 'Download CSV Template'}
          </AdminButton>
        </div>
        <div>
          <h2 className='text-base font-semibold mb-2'>2. Upload Completed CSV</h2>
          <p className='text-[13px] text-neutral-500 mb-4'>
            Upload the edited CSV file here. The system will match products by their <strong>slug</strong>.
          </p>
          <input
            type='file'
            accept='.csv'
            className='hidden'
            ref={fileRef}
            onChange={handleUpload}
          />
          <AdminButton onClick={() => fileRef.current?.click()} disabled={uploading}>
            <FiUpload className='inline-block mr-2' />
            {uploading ? 'Processing CSV...' : 'Upload CSV'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
