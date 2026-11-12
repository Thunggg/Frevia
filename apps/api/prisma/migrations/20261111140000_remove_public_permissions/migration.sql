-- Remove public routes from Permission table because they are globally accessible via @IsPublic()
-- and do not require RBAC role assignment.
DELETE FROM "Permission"
WHERE ("method" = 'GET'::"HttpMethod" AND "path" = '/api')
   OR ("method" = 'POST'::"HttpMethod" AND "path" IN (
        '/api/auth/register',
        '/api/auth/otp',
        '/api/auth/login',
        '/api/auth/refresh-token',
        '/api/auth/logout',
        '/api/auth/forgot-password',
        '/api/payments/webhook'
      ))
   OR ("method" = 'GET'::"HttpMethod" AND "path" IN (
        '/api/auth/google-link',
        '/api/auth/google/callback',
        '/api/forums/categories',
        '/api/forums/categories/top',
        '/api/forums/users/top',
        '/api/forums/categories/:id',
        '/api/forums/categories/by-slug/:slug',
        '/api/forums/posts',
        '/api/forums/posts/top',
        '/api/forums/posts/:id',
        '/api/forums/posts/by-slug/:slug',
        '/api/forums/posts/:id/like',
        '/api/profiles/:id',
        '/api/profiles/:id/skills',
        '/api/profiles/:id/portfolios',
        '/api/profiles/portfolios/:id',
        '/api/jobs',
        '/api/jobs/:slug',
        '/api/clients/:userId',
        '/api/account-profile/avatar/:userId/file',
        '/api/job-categories',
        '/api/job-categories/:slug',
        '/api/banners',
        '/api/banners/image/:filename',
        '/api/experts',
        '/api/experts/:id'
      ));

