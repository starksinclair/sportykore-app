App Name: Sportykore
App Type: Mobile application (iOS and Android)
Category: Sports League Management

What Sportykore does:
Sportykore is a mobile platform that allows individuals and organizations to create, manage, and participate in grassroots soccer leagues. It is designed primarily for recreational, amateur, and community-level soccer competitions.

Core features:
For League Owners/Admins:

Create and manage soccer leagues with custom settings
Create and manage seasons within a league
Create teams and assign team owners
Schedule and manage games including live score tracking
Log real-time match statistics (goals, assists, yellow cards, red cards, own goals)
Manage player rosters via invite links
View and manage league standings automatically calculated after each game
Upload league and team logos

For Team Owners:

Manage their assigned team
Set match lineups (starters, substitutes)
Log and accredit goals and assists during live games
Invite players to their team

For Players:

Create a player profile (display name, bio, optional avatar)
Join leagues via invite links sent by admins
View personal stats (goals, assists, appearances, cards)
View team standings, fixtures, and results
View match details and events

For General Users (not logged in):

Browse leagues, teams, and matches
View standings and fixtures
Search for leagues, teams, players, and countries

User types:
User TypeDescriptionLeague OwnerCreates and manages the entire leagueTeam OwnerManages a specific team within a leaguePlayerHas a player profile linked to their user accountGeneral UserBrowsing only, no management access

Data collected:
DataPurposeEmail addressAuthentication via one-time password (OTP)Display namePlayer profile identificationBio (optional)Player profileProfile photo/avatar (optional)Player and team identificationTeam and league logos (optional)League and team brandingMatch statisticsGoals, assists, cards attributed to playersDevice push notification tokenFuture match day notifications

Authentication:

One-time password (OTP) sent via email — no passwords stored
Future: Google Sign-In, Apple Sign-In

Third party services used:
ServicePurposeResendTransactional email delivery (OTP codes, welcome emails)AWS S3Storage for team logos, league logos, and player avatarsNeon (PostgreSQL)Database hostingGCP Cloud RunAPI server hostingUpstash RedisReal-time event broadcasting and rate limitingExpo Push NotificationsFuture push notification delivery

Target audience:

Grassroots and recreational soccer league organizers
Amateur soccer players
Community sports clubs
School and university sports coordinators
Corporate sports leagues
Primarily targeting Nigeria and Africa, with global availability

Key things to cover in Terms:

Users must be 13+ (or 18+ if you want to keep it simple) to create an account
League owners are responsible for the accuracy of match data and stats they enter
Player invite links are single-use and expire after 7 days
Sportykore is not responsible for disputes between league owners and players
Users can request account deletion and data removal
League owners can remove players from their roster
Sportykore reserves the right to suspend accounts that abuse the platform
Stats and standings are calculated automatically — Sportykore is not liable for calculation errors
User-uploaded content (logos, avatars) must not violate copyright or contain inappropriate material
The platform is provided as-is for recreational use and is not an official sports governing body

Key things to cover in Privacy Policy:

Email is the only required personal data
OTP codes are stored temporarily and deleted after use
Player stats are visible to all users of the league
Users can delete their account at any time from settings
Profile photos are stored on AWS S3
Emails are sent via Resend and subject to their privacy policy
No data is sold to third parties
Data may be stored on servers in the United States (AWS, GCP, Neon)
Cookie/tracking: none beyond what is necessary for authentication
You said: Can users under the age of 18 use your platform?

"Sportykore accounts are only available to users aged 18 and above. Players under the age of 18 may appear in league rosters as managed by league administrators, but may not create their own accounts."

"To report copyright infringement or request removal of content, contact us at legal@sportykore.com (or your support email). We will respond to valid takedown requests within 30 days."

Personal account data is deleted. Sports statistics and match records are anonymized and retained as part of league history.

We may disclose your personal information to the following third party service providers:

Resend (resend.com) — email delivery service used to send authentication codes and transactional emails
Amazon Web Services S3 (aws.amazon.com) — cloud storage used to store profile photos, league logos, and team logos
Neon (neon.tech) — database hosting provider that stores your account and league data
Google Cloud Platform (cloud.google.com) — cloud infrastructure used to host and run the Sportykore API server
Upstash (upstash.com) — Redis provider used for rate limiting and real-time event broadcasting

Each of these providers has entered into data processing agreements and is contractually obligated to protect your personal information and process it only as directed by Sportykore."

TODO: Before you scale beyond a few hundred users consider adding basic image moderation. AWS has a service called Rekognition that can automatically detect inappropriate images before they're stored:
ts// future implementation
const rekognition = new RekognitionClient({ region: 'us-east-1' })
const result = await rekognition.send(new DetectModerationLabelsCommand({
Image: { Bytes: imageBuffer }
}))
// reject if inappropriate content detected
Costs fractions of a cent per image and saves you from having to manually review reports. Worth adding before launch on the App Store since Apple has strict content policies.

legal@notifications.sportykore.com
https://waitlist.sportykore.com/privacy
https://waitlist.sportykore.com/terms
