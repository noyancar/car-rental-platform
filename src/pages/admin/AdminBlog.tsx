import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';
import type { BlogPost } from '../../types';

const AdminBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    category: 'general',
    tags: '',
    published: false,
  });

  // Load saved form state from localStorage on mount
  useEffect(() => {
    fetchPosts();

    // Restore form state from localStorage if it exists
    const savedFormData = localStorage.getItem('blog_form_data');
    const savedIsAddingPost = localStorage.getItem('blog_is_adding_post');

    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }

    if (savedIsAddingPost === 'true') {
      setIsAddingPost(true);
    }
  }, []);

  // Save form state to localStorage when it changes
  useEffect(() => {
    if (isAddingPost || editingPost) {
      localStorage.setItem('blog_form_data', JSON.stringify(formData));
      localStorage.setItem('blog_is_adding_post', isAddingPost.toString());
    }
  }, [formData, isAddingPost, editingPost]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as unknown as BlogPost[]);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const postData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image_url: formData.featured_image_url || null,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
        keywords,
        category: formData.category,
        tags,
        published: formData.published,
        published_at: formData.published ? new Date().toISOString() : null,
        read_time_minutes: calculateReadTime(formData.content),
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts' as any)
          .update(postData as any)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Blog post updated successfully');
      } else {
        const { error } = await supabase
          .from('blog_posts' as any)
          .insert([postData as any]);

        if (error) throw error;
        toast.success('Blog post created successfully');
      }

      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      toast.error(error.message || 'Failed to save blog post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image_url: post.featured_image_url || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      keywords: post.keywords?.join(', ') || '',
      category: post.category || 'general',
      tags: post.tags?.join(', ') || '',
      published: post.published,
    });
    setIsAddingPost(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts' as any)
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Blog post deleted successfully');
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts' as any)
        .update({
          published: !post.published,
          published_at: !post.published ? new Date().toISOString() : post.published_at,
        } as any)
        .eq('id', post.id);

      if (error) throw error;
      toast.success(`Post ${!post.published ? 'published' : 'unpublished'} successfully`);
      fetchPosts();
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      category: 'general',
      tags: '',
      published: false,
    });
    setEditingPost(null);
    setIsAddingPost(false);
    // Clear localStorage when form is reset
    localStorage.removeItem('blog_form_data');
    localStorage.removeItem('blog_is_adding_post');
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPublished === 'all' ||
                         (filterPublished === 'published' && post.published) ||
                         (filterPublished === 'draft' && !post.published);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Blog Management"
        subtitle="Create and manage SEO-optimized blog posts"
        showBackButton={false}
        showBreadcrumb={false}
        actions={
          <Button
            leftIcon={<Plus size={20} />}
            onClick={() => setIsAddingPost(true)}
          >
            New Blog Post
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Blog Posts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No blog posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {post.featured_image_url && (
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="h-10 w-16 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500">{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          post.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.views_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => togglePublished(post)}
                        className="text-blue-600 hover:text-blue-900"
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Basic Information</h4>

                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />

                <div>
                  <Input
                    label="Slug *"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">URL-friendly version of the title</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Short description of the blog post"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content * (Markdown Supported)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder="Write your blog post content here... (Supports Markdown)"
                    required
                  />
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p className="font-semibold mb-2">Markdown Quick Reference:</p>
                    <ul className="space-y-1 text-xs">
                      <li><code className="bg-white px-1 py-0.5 rounded"># Heading 1</code>, <code className="bg-white px-1 py-0.5 rounded">## Heading 2</code>, <code className="bg-white px-1 py-0.5 rounded">### Heading 3</code></li>
                      <li><code className="bg-white px-1 py-0.5 rounded">**bold text**</code> → <strong>bold text</strong></li>
                      <li><code className="bg-white px-1 py-0.5 rounded">*italic text*</code> → <em>italic text</em></li>
                      <li><code className="bg-white px-1 py-0.5 rounded">![alt text](image-url)</code> → Insert image</li>
                      <li><code className="bg-white px-1 py-0.5 rounded">[Link text](https://url.com)</code> → Create link</li>
                      <li><code className="bg-white px-1 py-0.5 rounded">- List item</code> or <code className="bg-white px-1 py-0.5 rounded">1. Numbered item</code></li>
                    </ul>
                    <p className="text-xs mt-2">Estimated read time: {calculateReadTime(formData.content)} min</p>
                  </div>
                </div>

                <Input
                  label="Featured Image URL"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="travel">Travel</option>
                      <option value="hawaii">Hawaii</option>
                      <option value="cars">Cars</option>
                      <option value="tips">Tips</option>
                      <option value="guides">Guides</option>
                    </select>
                  </div>

                  <Input
                    label="Tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="hawaii, oahu, car rental (comma-separated)"
                  />
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-lg">SEO Optimization</h4>

                <div>
                  <Input
                    label="Meta Title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Leave empty to use post title"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.meta_title.length || formData.title.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="SEO description (leave empty to use excerpt)"
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.meta_description.length || formData.excerpt.length}/160 characters
                  </p>
                </div>

                <div>
                  <Input
                    label="Keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="hawaii, oahu, honolulu, car rental (comma-separated)"
                  />
                  <p className="text-sm text-gray-500 mt-1">Target keywords for SEO</p>
                </div>
              </div>

              {/* Publish Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingPost ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
