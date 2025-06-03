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

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as SignUpFormValues,
    validationSchema: Yup.object({
      fullName: Yup.string()
        .required('Họ tên là bắt buộc')
        .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
      email: Yup.string()
        .email('Email không hợp lệ')
        .required('Email là bắt buộc'),
      password: Yup.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .required('Mật khẩu là bắt buộc'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Mật khẩu không khớp')
        .required('Xác nhận mật khẩu là bắt buộc'),
    }),
    onSubmit: async (values) => {
      try {
        const { confirmPassword, ...signUpData } = values;
        await authService.signUp(signUpData);
        navigate('/signin');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Đăng ký
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="fullName"
              name="fullName"
              label="Họ tên"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
              margin="normal"
            />

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

            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              margin="normal"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link href="/signin" variant="body2">
                {"Đã có tài khoản? Đăng nhập"}
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignUp; 