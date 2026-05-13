import { useState } from 'react'
import type { FormEvent } from 'react'
import './auth.css'
import { authService } from '../service/authService'

interface AuthPageProps {
    onLoginSuccess?: () => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
    // Default to signup per user request
    const [mode, setMode] = useState<'default' | 'signup' | 'forgot' | 'mb-signup' | 'mb-login'>('signup')
    const [animation, setAnimation] = useState<'bounceLeft' | 'bounceRight' | ''>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    // Icons
    const EyeIcon = () => (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx={12} cy={12} r={3} />
        </svg>
    )

    const EyeOffIcon = () => (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1={1} y1={1} x2={23} y2={23} />
        </svg>
    )

    // Compute card class based on mode and animation direction
    const cardClass = [
        'user_options-forms',
        animation,
        mode === 'default' && !animation ? 'show-login' : '',
        mode === 'signup' && !animation ? 'show-signup' : '',
        mode === 'forgot' ? 'show-forgotPass' : '',
        mode === 'mb-signup' ? 'show-signup' : '',
        mode === 'mb-login' ? 'show-login' : '',
    ].filter(Boolean).join(' ')

    const clearMsgs = () => { setError(''); setSuccess('') }

    const onLogin = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true); clearMsgs()
        try {
            await authService.login(email, password)
            setSuccess('Login successful!')
            setTimeout(() => {
                if (onLoginSuccess) onLoginSuccess()
                else window.location.href = '/'
            }, 800)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const onSignup = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true); clearMsgs()
        try {
            await authService.signup(fullName, email, password)
            setSuccess('Account created! Please log in.')
            // Switch back to login panel after signup
            setMode('default')
            setAnimation('bounceRight')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const onForgot = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true); clearMsgs()
        try {
            await authService.forgotPassword(email)
            setSuccess('If the account exists, a reset link has been sent.')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="user-authentication">
            <div className="user_options-container">

                <div className="user_options-text">
                    <div className="user_options-unregistered">
                        <h2 className="user_unregistered-title">Don't have an account?</h2>
                        <p className="user_unregistered-text">
                            Create one today and unlock everything we have to offer.
                            Quick, free, and worth it.
                        </p>
                        <button
                            className="user_unregistered-signup"
                            id="signup-button"
                            onClick={() => {
                                clearMsgs();
                                setMode('signup');
                                setAnimation('bounceLeft');
                            }}
                        >
                            Sign up
                        </button>
                    </div>

                    <div className="user_options-registered">
                        <h2 className="user_registered-title">Have an account?</h2>
                        <p className="user_registered-text">
                            Welcome back! Log in to pick up right where you left off.
                        </p>
                        <button
                            className="user_registered-login"
                            id="login-button"
                            onClick={() => {
                                clearMsgs();
                                setMode('default');
                                setAnimation('bounceRight');
                            }}
                        >
                            Login
                        </button>
                    </div>
                </div>

                <div className={cardClass} id="user_options-forms">

                    {/* Status messages */}
                    {(error || success) && (
                        <div className={`forms_alert ${error ? 'forms_alert--error' : 'forms_alert--success'}`}>
                            {error || success}
                        </div>
                    )}

                    {/* ── Login ── */}
                    <div className="user_forms-login">
                        <h2 className="forms_title">Login</h2>
                        <form className="forms_form" onSubmit={onLogin}>
                            <fieldset className="forms_fieldset">
                                <div className="forms_field">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="forms_field-input"
                                        required
                                        autoFocus
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="forms_field">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="forms_field-input"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </fieldset>
                            <div className="forms_buttons">
                                <button
                                    type="button"
                                    className="forms_buttons-forgot"
                                    id="forget-button"
                                    onClick={() => { clearMsgs(); setMode('forgot') }}
                                >
                                    Forgot password?
                                </button>
                                <button
                                    type="submit"
                                    className="forms_buttons-action"
                                    disabled={loading}
                                >
                                    {loading ? '...' : 'Login'}
                                </button>
                                <button
                                    type="button"
                                    className="forms_buttons-mb-button"
                                    id="signup-button-mb"
                                    onClick={() => { clearMsgs(); setMode('mb-signup') }}
                                >
                                    Sign up
                                </button>
                            </div>
                            <div className="forms_divider"><span>OR</span></div>
                            <button
                                type="button"
                                className="forms_buttons-google"
                                onClick={() => authService.loginWithGoogle()}
                                disabled={loading}
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                Continue with Google
                            </button>
                        </form>
                    </div>

                    {/* ── Sign Up ── */}
                    <div className="user_forms-signup">
                        <h2 className="forms_title">Sign Up</h2>
                        <form className="forms_form" onSubmit={onSignup}>
                            <fieldset className="forms_fieldset">
                                <div className="forms_field">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="forms_field-input"
                                        required
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>
                                <div className="forms_field">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="forms_field-input"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="forms_field">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="forms_field-input"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </fieldset>
                            <div className="forms_buttons">
                                <button
                                    type="submit"
                                    className="forms_buttons-action"
                                    disabled={loading}
                                >
                                    {loading ? '...' : 'Sign up'}
                                </button>
                                <button
                                    type="button"
                                    className="forms_buttons-mb-button"
                                    id="login-button-mb"
                                    onClick={() => { clearMsgs(); setMode('mb-login') }}
                                >
                                    Login
                                </button>
                            </div>
                            <div className="forms_divider"><span>OR</span></div>
                            <button
                                type="button"
                                className="forms_buttons-google"
                                onClick={() => authService.loginWithGoogle()}
                                disabled={loading}
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                Continue with Google
                            </button>
                        </form>
                    </div>

                    {/* ── Forgot Password ── */}
                    <div className="user_forms-forgot">
                        <h2 className="forms_title">Forgot Password</h2>
                        <form className="forms_form" onSubmit={onForgot}>
                            <fieldset className="forms_fieldset">
                                <div className="forms_field">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="forms_field-input"
                                        required
                                        autoFocus
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </fieldset>
                            <div className="forms_buttons">
                                <button
                                    type="button"
                                    className="forms_buttons-forgot"
                                    onClick={() => { clearMsgs(); setMode('mb-login') }}
                                >
                                    Back to login
                                </button>
                                <button
                                    type="submit"
                                    className="forms_buttons-action"
                                    disabled={loading}
                                >
                                    {loading ? '...' : 'Send reset link'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </section>
    );
}
