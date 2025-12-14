import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '../components/seo/SEO';
import { MarkdownContent } from '../components/blog/MarkdownContent';
import { supabase } from '../lib/supabase';
import type { BlogPost } from '../types';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Fetch the blog post
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Post not found
          navigate('/blog');
          toast.error('Blog post not found');
          return;
        }
        throw error;
      }

      setPost(data);

      // Increment view count
      await supabase.rpc('increment_blog_post_views', { post_id: data.id });

      // Fetch related posts (same category, excluding current post)
      if (data.category) {
        const { data: related } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3);

        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast.error('Failed to load blog post');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title || 'NYN Rentals Blog';

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <SEO
        title={post.meta_title || `${post.title} | NYN Rentals Blog`}
        description={post.meta_description || post.excerpt || post.content.substring(0, 160)}
        canonical={`https://nynrentals.com/blog/${post.slug}`}
        ogType="article"
        ogImage={post.featured_image_url}
        keywords={post.keywords}
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        section={post.category}
        tags={post.tags}
      />

      <article className="bg-white min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50">
          <div className="container-custom py-8">
            <Link
              to="/blog"
              className="inline-flex items-center space-x-2 text-primary-700 hover:text-primary-800 font-medium mb-6"
            >
              <ArrowLeft size={20} />
              <span>Back to Blog</span>
            </Link>

            <div className="max-w-4xl">
              {/* Category Badge */}
              {post.category && (
                <span className="inline-block px-3 py-1 bg-primary-700 text-white text-sm font-semibold rounded-full mb-4">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-volcanic-900 mb-4">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg md:text-xl text-volcanic-600 mb-6">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600">
                {post.author_name && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-primary-800 font-semibold">
                        {post.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{post.author_name}</span>
                  </div>
                )}
                {post.published_at && (
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
                {post.read_time_minutes && (
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{post.read_time_minutes} min read</span>
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-1 hover:text-primary-700 transition-colors"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="container-custom">
            <div className="max-w-full mx-auto h-64 md:h-96 lg:h-[500px] overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content Area with Sidebar */}
        <div className="relative py-12">
          <div className="container-custom">
            <div className="max-w-full mx-auto flex gap-8">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Blog Content */}
                <div className="mb-12">
                  <MarkdownContent content={post.content} />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="border-t border-b border-gray-200 py-6 mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                        >
                          <Tag size={14} />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile Slider - Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="lg:hidden mb-8">
                    <h3 className="text-xl font-display font-bold text-volcanic-900 mb-4">
                      Related Articles
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                      {relatedPosts.map((relatedPost) => (
                        <Link
                          key={relatedPost.id}
                          to={`/blog/${relatedPost.slug}`}
                          className="flex-shrink-0 w-72 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow snap-start group"
                        >
                          {relatedPost.featured_image_url && (
                            <div className="h-40 overflow-hidden">
                              <img
                                src={relatedPost.featured_image_url}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="font-semibold text-volcanic-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                              {relatedPost.title}
                            </h4>
                            {relatedPost.excerpt && (
                              <p className="text-sm text-volcanic-600 line-clamp-2">
                                {relatedPost.excerpt}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <div className="bg-primary-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-volcanic-900 mb-2">
                    Found this helpful?
                  </h3>
                  <p className="text-volcanic-600 mb-4">
                    Share this post with others planning their Hawaii adventure!
                  </p>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    <Share2 size={18} />
                    <span>Share This Post</span>
                  </button>
                </div>
              </div>

              {/* Sidebar - Desktop Only (Outside container-custom padding) */}
              {relatedPosts.length > 0 && (
                <aside className="hidden lg:block lg:w-80 flex-shrink-0">
                  <div className="sticky top-8">
                    <h3 className="text-xl font-display font-bold text-volcanic-900 mb-4">
                      Related Articles
                    </h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link
                          key={relatedPost.id}
                          to={`/blog/${relatedPost.slug}`}
                          className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all group"
                        >
                          {relatedPost.featured_image_url && (
                            <div className="h-32 overflow-hidden">
                              <img
                                src={relatedPost.featured_image_url}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="font-semibold text-sm text-volcanic-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                              {relatedPost.title}
                            </h4>
                            {relatedPost.excerpt && (
                              <p className="text-xs text-volcanic-600 line-clamp-2">
                                {relatedPost.excerpt}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPostPage;
