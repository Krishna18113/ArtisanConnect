import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShoppingCart,
  IndianRupee,
  Loader2,
  Package,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JoinOrderDialog from '@/components/JoinOrderDialog';

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) ** 2;
  return R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory] = useState('All');
  const [showPreparedOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('none');
  const [sortBy, setSortBy] = useState('none');
  const [sortOrder, setSortOrder] = useState('asc');
  const [targetCurrency] = useState('INR');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (locationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocationEnabled(false)
      );
    } else if (!locationEnabled) {
      setUserLocation(null);
    }
  }, [locationEnabled]);

  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: [
      'products',
      {
        prepared: showPreparedOnly,
        search: searchTerm,
        minPrice,
        maxPrice,
        minRating,
        sortBy,
        sortOrder,
        targetCurrency,
      },
    ],
    queryFn: () =>
      getProducts({
        prepared: showPreparedOnly,
        search: searchTerm,
        minPrice,
        maxPrice,
        minRating: minRating === 'none' ? undefined : minRating,
        sortBy: sortBy === 'none' ? undefined : sortBy,
        sortOrder: sortBy === 'none' ? undefined : sortOrder,
        targetCurrency,
      }),
  });

  let products = productsData?.data || [];
  if (locationEnabled && userLocation) {
    products = products
      .map((p) => {
        const coords = p.artisan?.address?.coords;
        return coords
          ? { ...p, distance: haversineDistance(userLocation, coords) }
          : { ...p, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const handleOrderNow = (p) => {
    setSelectedProduct(p);
    setIsDialogOpen(true);
  };

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg">
        Error fetching products.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-x-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-green-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
            Browse <span className="text-green-700">Products</span>
          </h1>
          <p className="mt-3 text-gray-600 text-base sm:text-lg">
            Discover high-quality ingredients & supplies from verified artisans.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-5 bg-white rounded-xl p-6 shadow-sm border mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by product or artisan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant={locationEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLocationEnabled((v) => !v)}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {locationEnabled ? 'Location ON' : 'Location OFF'}
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-32 bg-white border-gray-200"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-32 bg-white border-gray-200"
            />
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Min. Rating:</span>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-[110px] bg-white border-gray-200">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md rounded-md z-50">
                  <SelectItem value="none">Any</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px] bg-white border-gray-200">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md rounded-md z-50">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sortBy !== 'none' && (
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[100px] bg-white border-gray-200">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md rounded-md z-50">
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Product cards */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                className="flex flex-col h-full overflow-hidden rounded-xl bg-white border hover:shadow-lg transition-shadow"
              >
                <Link to={`/products/${product._id}`}>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                    />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {product.name}
                      </CardTitle>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                      by{' '}
                      {product.artisan ? (
                        <span
                          className="text-green-700 underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/artisans/${product.artisan._id}`);
                          }}
                        >
                          {product.artisan.businessName || product.artisan.name}
                        </span>
                      ) : (
                        'Unknown'
                      )}
                      {product.distance &&
                        isFinite(product.distance) &&
                        userLocation && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({product.distance.toFixed(1)} km)
                          </span>
                        )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-between flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4 text-green-700" />
                        <span className="text-xl font-bold text-green-700">
                          {product.convertedCurrency
                            ? `${product.convertedCurrency} ${product.pricePerKg.toFixed(2)}`
                            : `₹${product.pricePerKg}`}
                        </span>
                        <span className="text-gray-500">/{product.unit}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Min. Order</div>
                        <div className="font-semibold text-gray-700">
                          {product.minOrderQty} {product.unit}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  </CardContent>
                </Link>

                {(!user || user.role !== 'artisan') && (
                  <CardContent className="pt-0">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      onClick={() => handleOrderNow(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Order Now
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <JoinOrderDialog
          product={selectedProduct}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default Products;
