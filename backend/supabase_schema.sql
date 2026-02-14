-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  email text unique not null,
  password text not null, -- Storing hashed password from existing logic
  avatar text default '',
  channel_id uuid, -- Will link to channel after creation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHANNELS Table
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  handle text unique not null,
  description text default '',
  avatar text default '',
  banner text default '',
  owner_id uuid references public.users(id) on delete cascade not null,
  subscriber_count int default 0,
  video_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key to users.channel_id manually due to circular dependency
alter table public.users 
add constraint fk_user_channel 
foreign key (channel_id) references public.channels(id) on delete set null;

-- VIDEOS Table
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text default '',
  video_url text not null,
  thumbnail_url text default '',
  channel_id uuid references public.channels(id) on delete cascade not null,
  uploader_id uuid references public.users(id) on delete cascade not null,
  views int default 0,
  duration text default '0:00',
  category text default 'Other',
  tags text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMMENTS Table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  user_id uuid references public.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTIONS Table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  subscriber_id uuid references public.users(id) on delete cascade not null,
  channel_id uuid references public.channels(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(subscriber_id, channel_id)
);

-- LIKES Table (Video Likes)
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  type text check (type in ('like', 'dislike')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- POSTS Table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  image_url text default '',
  channel_id uuid references public.channels(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POST_LIKES Table
create table public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- RLS Disable
alter table public.posts disable row level security;
alter table public.post_likes disable row level security;

-- STORAGE BUCKETS
-- Note: You need to create buckets 'avatars', 'banners', 'videos', 'thumbnails', 'posts' in the dashboard.
