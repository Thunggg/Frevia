# Demo: Following, Notifications, and Roles

This walkthrough covers:

- Following, Follow Freelancer, and Unfollow Freelancer
- Notification List, Mark Notification Read, Mark All Notifications Read, and Delete Notification
- Join New Role and Switch Role

## 1. Prepare the demo data

The Infisical `/api` environment must contain `DIRECT_URL`, all `SEED_*_EMAIL`, and all `SEED_*_PASSWORD` values used by the main seed.

From the repository root, run:

```bash
pnpm --filter api seed
pnpm --filter api seed:relationships-demo
```

The second command prints the Client login email and the exact profile URL used by the demo. It can be run again safely: the follow relationship is upserted and only its four own demo notifications are recreated.

For `Join New Role`, use a freshly seeded Client account that has not added the Freelancer role before. The script prints `joinFreelancerRoleReady: true` when this state is ready.

## 2. Start the application

Use two terminals from the repository root:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

Open [http://localhost:3001](http://localhost:3001) and sign in with `SEED_CLIENT_EMAIL` and `SEED_CLIENT_PASSWORD`.

## 3. Demo script

### Following, Unfollow, and Follow

1. Open the user menu and select **Following**, or visit `/account-profile?tab=following`.
2. Confirm the seeded freelancer appears in the list.
3. Click the remove/unfollow action and confirm the freelancer disappears. This demonstrates **Unfollow Freelancer** and the updated **Following** list.
4. Open the `followingProfileUrl` printed by the seed command.
5. Click **Follow**. The button changes to **Following**.
6. Return to `/account-profile?tab=following` and confirm the freelancer is listed again.

### Notifications

1. Click the bell in the header. The unread badge and recent notifications demonstrate the notification preview.
2. Select **View all notifications**, or visit `/notifications`, to demonstrate **Notification List**.
3. Mark one unread item as read and confirm its unread styling/badge changes.
4. Click **Mark all as read** and confirm the unread count becomes zero.
5. Delete one notification and confirm it disappears. The API performs a soft delete.

To repeat this section, rerun `pnpm --filter api seed:relationships-demo` and refresh the page.

### Join New Role and Switch Role

1. While signed in as the fresh Client account, open the user menu.
2. Click **Add Freelancer role**. The same account gains the Freelancer role, receives a new session token, and is redirected to `/find-work`.
3. Open the user menu again and click **Switch to Client**. The working context changes and redirects to `/client/jobs` without signing out.
4. Open the menu once more and click **Switch to Freelancer** to demonstrate switching in the other direction.

Joining a role is intentionally a one-time account action. After it succeeds, the menu shows **Switch to ...** instead of **Add ... role**.
