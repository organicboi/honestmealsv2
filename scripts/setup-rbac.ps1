# RBAC System Setup Script
# Run this after setting up your Supabase project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Honest Meals RBAC Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if migrations directory exists
if (-not (Test-Path "database/migrations")) {
    Write-Host "❌ Error: database/migrations directory not found" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Available Migrations:" -ForegroundColor Green
Write-Host ""
Write-Host "   1. 001_setup_roles.sql" -ForegroundColor White
Write-Host "      - Creates default roles (standard_user, admin, moderator, trainer, influencer)" -ForegroundColor Gray
Write-Host "      - Sets up JWT helper functions" -ForegroundColor Gray
Write-Host "      - Creates automatic role assignment trigger" -ForegroundColor Gray
Write-Host "      - Enables RLS on user_roles table" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. 002_custom_access_token_hook.sql" -ForegroundColor White
Write-Host "      - Creates Custom Access Token Hook function" -ForegroundColor Gray
Write-Host "      - Injects roles into JWT tokens" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Run Migration Files" -ForegroundColor Yellow
Write-Host "   1. Go to Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "   2. Copy contents of: database/migrations/001_setup_roles.sql" -ForegroundColor White
Write-Host "   3. Paste and Execute" -ForegroundColor White
Write-Host "   4. Copy contents of: database/migrations/002_custom_access_token_hook.sql" -ForegroundColor White
Write-Host "   5. Paste and Execute" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Enable Custom Access Token Hook" -ForegroundColor Yellow
Write-Host "   1. Go to: Supabase Dashboard → Authentication → Hooks" -ForegroundColor White
Write-Host "   2. Click 'Create a new hook'" -ForegroundColor White
Write-Host "   3. Select hook type: 'Custom Access Token'" -ForegroundColor White
Write-Host "   4. Select function: 'custom_access_token_hook'" -ForegroundColor White
Write-Host "   5. Enable the hook" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Verify Setup" -ForegroundColor Yellow
Write-Host "   Run the following SQL to verify roles were created:" -ForegroundColor White
Write-Host ""
Write-Host "   SELECT * FROM public.roles ORDER BY name;" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Test Signup" -ForegroundColor Yellow
Write-Host "   1. Sign up a new user through your app" -ForegroundColor White
Write-Host "   2. Check the user_roles table:" -ForegroundColor White
Write-Host ""
Write-Host "   SELECT u.email, r.name FROM auth.users u" -ForegroundColor Cyan
Write-Host "   JOIN public.user_roles ur ON u.id = ur.user_id" -ForegroundColor Cyan
Write-Host "   JOIN public.roles r ON ur.role_id = r.id;" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Quick Reference" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Migration Files:" -ForegroundColor Green
Write-Host "   - database/migrations/001_setup_roles.sql" -ForegroundColor White
Write-Host "   - database/migrations/002_custom_access_token_hook.sql" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Green
Write-Host "   - docs/roles/rolesImplementation.md" -ForegroundColor White
Write-Host "   - docs/SIGNUP_RBAC_INTEGRATION.md" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Code Files:" -ForegroundColor Green
Write-Host "   - app/actions/auth.ts (Updated signup function)" -ForegroundColor White
Write-Host "   - lib/auth/roles.ts (Role utilities)" -ForegroundColor White
Write-Host "   - lib/auth/roleQueries.ts (Database queries)" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "   Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "   Auth Hooks Docs: https://supabase.com/docs/guides/auth/auth-hooks" -ForegroundColor White
Write-Host ""

# Open migration files in VS Code
$openFiles = Read-Host "Would you like to open the migration files in VS Code? (y/n)"
if ($openFiles -eq 'y' -or $openFiles -eq 'Y') {
    code database/migrations/001_setup_roles.sql
    code database/migrations/002_custom_access_token_hook.sql
    Write-Host "✅ Migration files opened in VS Code" -ForegroundColor Green
}

Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
