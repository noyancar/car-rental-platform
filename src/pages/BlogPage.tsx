import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ChevronRight } from 'lucide-react';
import { SEO } from '../components/seo/SEO';
import { supabase } from '../lib/supabase';
import type { BlogPost } from '../types';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(posts.map(post => post.category).filter(Boolean)))];

  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  return (
    <>
      <SEO
        title="NYN Rentals Blog - Hawaii Travel Tips & Car Rental Guides"
        description="Discover Hawaii travel tips, car rental guides, and Oahu adventures. Expert advice for exploring Honolulu, Waikiki, North Shore, and more with NYN Rentals."
        canonical="https://nynrentals.com/blog"
        ogType="website"
        keywords={['hawaii blog', 'oahu travel tips', 'honolulu guide', 'car rental hawaii', 'hawaii vacation']}
      />

      <div className="bg-gradient-to-br from-primary-50 to-blue-50 py-12 md:py-16">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-volcanic-900 mb-4">
              NYN Rentals Blog
            </h1>
            <p className="text-lg md:text-xl text-volcanic-600">
              Your guide to exploring Hawaii, Oahu adventures, car rental tips, and travel inspiration
            </p>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white min-h-screen">
        <div className="container-custom">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="loading-spinner h-12 w-12"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
              <p className="text-gray-500">Check back soon for travel tips and guides!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-hawaii overflow-hidden hover:shadow-card-hover transition-all duration-300 flex flex-col h-full group"
                >
                  {/* Featured Image */}
                  {post.featured_image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                      {post.category && (
                        <span className="absolute top-3 left-3 px-3 py-1 bg-primary-700 text-white text-xs font-semibold rounded-full">
                          {post.category}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    {/* Title */}
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-display font-bold text-volcanic-900 mb-3 group-hover:text-primary-700 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-volcanic-600 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        {post.published_at && (
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        {post.read_time_minutes && (
                          <div className="flex items-center space-x-1">
                            <Clock size={16} />
                            <span>{post.read_time_minutes} min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            <Tag size={12} />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More Link */}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center space-x-2 text-primary-700 hover:text-primary-800 font-semibold group"
                    >
                      <span>Read More</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
