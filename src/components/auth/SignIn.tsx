import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

interface SignInFormValues {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    } as SignInFormValues,
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Email không hợp lệ')
        .required('Email là bắt buộc'),
      password: Yup.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .required('Mật khẩu là bắt buộc'),
    }),
    onSubmit: async (values) => {
      try {
        await authService.signIn(values);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Đăng nhập
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
            
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Mật khẩu"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link href="/signup" variant="body2">
                {"Chưa có tài khoản? Đăng ký ngay"}
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignIn; 