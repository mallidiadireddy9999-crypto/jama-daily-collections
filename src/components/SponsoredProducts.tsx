import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  image: string;
  size: string;
  price: string;
  originalPrice?: string;
}

interface SponsoredProductsProps {
  className?: string;
}

export const SponsoredProducts = ({ className = "" }: SponsoredProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for sponsored products since we don't have a products table yet
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Rice',
      image: '',
      size: '25 KG',
      price: '₹1,250',
      originalPrice: '₹1,400'
    },
    {
      id: '2', 
      name: 'Quality Oil',
      image: '',
      size: '5 LTR',
      price: '₹650',
    },
    {
      id: '3',
      name: 'Pure Wheat',
      image: '',
      size: '20 KG', 
      price: '₹800',
      originalPrice: '₹950'
    },
    {
      id: '4',
      name: 'Sugar Pack',
      image: '',
      size: '10 KG',
      price: '₹450',
    },
    {
      id: '5',
      name: 'Tea Powder',
      image: '',
      size: '1 KG',
      price: '₹320',
      originalPrice: '₹380'
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      try {
        // In the future, this could fetch from a real products table
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching sponsored products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (productId: string, productName: string) => {
    // This would typically integrate with a cart system
    console.log(`Added ${productName} to cart`);
    // You could show a toast notification here
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Sponsored Products</h2>
            <Badge variant="outline" className="text-xs">Advertisement</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <Card key={index} className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="w-full h-24 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Sponsored Products</h2>
          <Badge variant="outline" className="text-xs border-primary/20 text-primary">Advertisement</Badge>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-background to-primary/5"
            >
              <div className="space-y-3">
                {/* Product Image Placeholder */}
                <div className="w-full h-24 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                
                {/* Product Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {product.name}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground font-medium">
                    {product.size}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-primary">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Add Button */}
                <Button 
                  size="sm" 
                  className="w-full h-8 text-xs font-semibold bg-primary hover:bg-primary/90"
                  onClick={() => handleAddToCart(product.id, product.name)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-4 opacity-75">
          * These are sponsored product listings. Prices and availability may vary.
        </p>
      </div>
    </div>
  );
};