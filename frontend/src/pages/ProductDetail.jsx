import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RouteMap from '../components/RouteMap';
import ArtisanLocationMap from '../components/ArtisanLocationMap';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import JoinOrderDialog from '../components/JoinOrderDialog';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);

  const isAnyDialogOpen = isOrderDialogOpen;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBuyerLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationError(null);
        },
        () => setLocationError("Could not get your location. Route calculation disabled."),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const { data: productData, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  const product = productData?.data;
  const artisanCoords = product?.location || product?.artisan?.address?.coords;
  const isOwner = user?._id === product?.artisan?._id;

  const handleChatClick = async () => {
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/conversations/${product.artisan._id}/${product._id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate(`/chat/${res.data.conversationId}`);
    } catch {
      setChatError('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleOrderClick = () => {
    setSelectedProductForOrder(product);
    setIsOrderDialogOpen(true);
  };

  if (isLoading)
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (isError || !product)
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Error loading product details</h2>
        <p className="text-muted-foreground">{error?.message || 'Product not found.'}</p>
        <Button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 transition rounded-lg px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-gray-700 hover:text-gray-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow bg-white border border-gray-100">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="w-full h-80 object-cover" />
              )}
              <CardHeader className="px-6 pt-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{product.category}</Badge>
                </div>
                <CardDescription className="text-gray-500 mt-2">{product.description || 'No description provided.'}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                {/* Pricing & Artisan Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-2">Pricing & Quantity</h3>
                    <p className="text-gray-600">Price: <span className="font-bold text-green-600 text-xl">{product.convertedCurrency ? `${product.convertedCurrency} ${product.pricePerKg.toFixed(2)}` : `₹${product.pricePerKg}`}</span> / {product.unit}</p>
                    <p className="text-gray-600">Min. Order: <span className="font-bold">{product.minOrderQty}</span> {product.unit}</p>
                    <p className="text-gray-600">Available Stock: <span className="font-bold">{product.availableQty}</span> {product.unit}</p>
                  </div>
                  {product.artisan && (
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                      <h3 className="text-xl font-semibold mb-2">Artisan Information</h3>
                      <p className="text-gray-600">Artisan: <Link to={`/artisans/${product.artisan._id}`} className="text-primary underline font-bold">{product.artisan.businessName || product.artisan.name}</Link></p>
                      {product.artisan.address && (
                        <p className="text-gray-600 flex items-center"><MapPin className="w-4 h-4 mr-1" />{product.artisan.address.street}, {product.artisan.address.city}, {product.artisan.address.state} - {product.artisan.address.zipCode}</p>
                      )}
                      {artisanCoords && <p className="text-gray-400 text-sm mt-1">(Lat: {artisanCoords.lat}, Lng: {artisanCoords.lng})</p>}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {user?.role !== 'artisan' && product.artisan && (
                  <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <Button onClick={handleChatClick} className="w-full md:w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all">{chatLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Chat with Artisan'}</Button>
                    <Button onClick={handleOrderClick} className="w-full md:w-1/2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all">Order</Button>
                    {chatError && <p className="text-destructive text-sm mt-2">{chatError}</p>}
                  </div>
                )}

                {/* Reviews */}
                {product.reviews?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Reviews ({product.reviews.length})</h3>
                    <p className="text-gray-600">Average Rating: {product.averageRating?.toFixed(1)} / 5</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map / Route */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-xl h-full hover:shadow-2xl transition-shadow bg-white border border-gray-100">
              <CardHeader className="px-6 pt-6">
                <CardTitle>Artisan Location & Route</CardTitle>
                <CardDescription>Find your way to the artisan.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 h-96 flex flex-col justify-center">
                {artisanCoords ? (
                  locationError ? (
                    <p className="text-destructive text-sm mb-2">{locationError}</p>
                  ) : <RouteMap buyerCoords={buyerLocation} artisanCoords={artisanCoords} isDialogOpen={isAnyDialogOpen} userRole={user?.role} />
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="font-semibold">Location Not Available</h3>
                    <p className="text-gray-400 text-sm mt-1">{isOwner ? "Add your location to show it on the map." : "This artisan has not set their location yet."}</p>
                    {isOwner && <Button asChild className="mt-4"><Link to="/artisan-profile-page">Set Location</Link></Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedProductForOrder && (
        <JoinOrderDialog
          product={selectedProductForOrder}
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
