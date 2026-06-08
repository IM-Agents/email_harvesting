import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useState } from "react"

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Min 6 characters").required("Password is required"),
})

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth()
  const [apiError, setApiError] = useState("")

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setApiError("")
    try {
      await login(values.email, values.password)
    } catch (err) {
      setApiError(err.message || "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">Email Harvesting</h1>
        <p className="mt-1 text-sm text-slate-500">Contact Discovery Automation</p>

        <Formik initialValues={{ email: "", password: "" }} validationSchema={schema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-invalid={apiError ? "true" : undefined}
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" role="alert" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" role="alert" />
              </div>

              {apiError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
