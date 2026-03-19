import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <Navigation />
          <div style={{ padding: '2rem 0' }}>
            <Routes>
              <Route path='/' element={<Navigate to='/products' />} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />

              <Route
                path='/products'
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />

              <Route
                path='/products/:id'
                element={
                  <PrivateRoute>
                    <ProductDetail />
                  </PrivateRoute>
                }
              />

              <Route
                path='/create-product'
                element={
                  <PrivateRoute>
                    <CreateProduct />
                  </PrivateRoute>
                }
              />

              <Route
                path='/edit-product/:id'
                element={
                  <PrivateRoute>
                    <EditProduct />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
