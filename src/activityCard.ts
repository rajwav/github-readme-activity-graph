import { ActivityData } from './interfaces/activity';
import { selectColors } from './styles/themes';

export class ActivityCard {
    private readonly data: ActivityData;
    private readonly themeName: string;
    private readonly hideBorder: boolean;
    private readonly limit: number;

    constructor(data: ActivityData, query: any) {
        this.data = data;
        this.themeName = (query?.theme as string) || 'tokyo-night';
        this.hideBorder = query?.hide_border === 'true' || query?.hide_border === '1';
        this.limit = Math.min(10, Math.max(3, parseInt((query?.limit as string) || '6', 10)));
    }

    public render(): string {
        const colors = selectColors(this.themeName);
        const bg = `#${colors.bgColor.replace('#', '')}`;
        const accent = `#${colors.lineColor.replace('#', '')}`;
        const titleColor = `#${colors.titleColor.replace('#', '')}`;
        const textColor = `#${colors.color.replace('#', '')}`;
        const borderColor = this.hideBorder ? 'none' : '#30363d';
        const subTextColor = '#8B949E';
        const cardBg = colors.bgColor === '00000000' ? 'none' : bg;

        const displayedCommits = this.data.commitActivities.slice(0, this.limit);
        const displayedRepos = this.data.createdRepos.slice(0, this.limit);
        const maxCommits = Math.max(1, ...displayedCommits.map((c) => c.commits));

        // Calculate dynamic height
        let currentY = 88; // Start after header

        // Month section
        const monthY = currentY;
        currentY += 28;

        // Commits section
        const commitsHeaderY = currentY;
        currentY += 24;
        const commitsStartY = currentY;
        const commitsHeight = displayedCommits.length * 26;
        currentY += commitsHeight + 16;

        // Repositories section
        let reposHeaderY = currentY;
        let reposStartY = currentY + 24;
        let reposHeight = 0;
        if (displayedRepos.length > 0) {
            reposHeight = Math.ceil(displayedRepos.length / 2) * 26;
            currentY += 24 + reposHeight + 16;
        }

        const totalHeight = currentY + 16;

        // Commit rows SVG
        const commitRowsSvg = displayedCommits
            .map((repo, idx) => {
                const y = commitsStartY + idx * 26;
                const barWidth = Math.round((repo.commits / maxCommits) * 110);
                return `
                    <g transform="translate(56, ${y})">
                        <text x="0" y="14" fill="${accent}" font-size="13" font-weight="500" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${repo.nameWithOwner}</text>
                        <rect x="360" y="4" width="110" height="10" rx="5" fill="#21262D" />
                        <rect x="360" y="4" width="${Math.max(8, barWidth)}" height="10" rx="5" fill="${accent}" />
                        <text x="485" y="13" fill="${subTextColor}" font-size="11" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${repo.commits} commit${repo.commits === 1 ? '' : 's'}</text>
                    </g>
                `;
            })
            .join('');

        // Created repos pills SVG (2 columns)
        const reposPillsSvg = displayedRepos
            .map((repo, idx) => {
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const x = 56 + col * 340;
                const y = reposStartY + row * 26;
                const langDot = repo.language
                    ? `<circle cx="0" cy="9" r="4" fill="${repo.language.color}" /><text x="8" y="13" fill="${subTextColor}" font-size="11" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${repo.language.name}</text>`
                    : '';

                return `
                    <g transform="translate(${x}, ${y})">
                        <text x="0" y="14" fill="${accent}" font-size="13" font-weight="500" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${repo.nameWithOwner}</text>
                        <g transform="translate(${Math.min(230, repo.nameWithOwner.length * 8 + 10)}, 0)">
                            ${langDot}
                        </g>
                    </g>
                `;
            })
            .join('');

        return `
<svg width="860" height="${totalHeight}" viewBox="0 0 860 ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
        .header-title { font: 700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; fill: ${titleColor}; }
        .header-sub { font: 400 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; fill: ${subTextColor}; }
        .month-title { font: 700 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; fill: ${titleColor}; }
        .section-title { font: 600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; fill: ${textColor}; }
        .badge { font: 600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    </style>

    <!-- Card Background -->
    <rect width="860" height="${totalHeight}" rx="10" fill="${cardBg}" stroke="${borderColor}" stroke-width="1" />

    <!-- Top Header -->
    <g transform="translate(24, 28)">
        <!-- Activity Icon -->
        <svg x="0" y="0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <text x="28" y="16" class="header-title">${this.data.name} (@${this.data.login}) — GitHub Activity Timeline</text>
        
        <!-- Summary Stats Pills -->
        <g transform="translate(610, -2)">
            <rect x="0" y="0" width="95" height="22" rx="11" fill="#21262D" />
            <text x="47" y="15" text-anchor="middle" class="badge" fill="${accent}">⚡ ${this.data.totalCommits} Commits</text>
        </g>
        <g transform="translate(712, -2)">
            <rect x="0" y="0" width="105" height="22" rx="11" fill="#21262D" />
            <text x="52" y="15" text-anchor="middle" class="badge" fill="#10B981">📦 ${this.data.totalCreatedRepos} Repos</text>
        </g>
    </g>

    <!-- Header Divider Line -->
    <line x1="24" y1="62" x2="836" y2="62" stroke="#21262D" stroke-width="1" />

    <!-- Vertical Timeline Track -->
    <line x1="34" y1="${monthY + 8}" x2="34" y2="${totalHeight - 24}" stroke="#30363D" stroke-width="2" stroke-linecap="round" />

    <!-- Month Node & Label -->
    <g transform="translate(24, ${monthY})">
        <circle cx="10" cy="8" r="6" fill="${accent}" stroke="${bg}" stroke-width="2" />
        <text x="32" y="13" class="month-title">${this.data.month}</text>
    </g>

    <!-- 1. Commit Activity Section -->
    <g transform="translate(34, ${commitsHeaderY})">
        <!-- Commit Icon -->
        <g transform="translate(-10, -3)">
            <circle cx="10" cy="10" r="10" fill="#21262D" />
            <svg x="2" y="2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="1.05" y1="12" x2="7" y2="12"></line>
                <line x1="17.01" y1="12" x2="22.96" y2="12"></line>
            </svg>
        </g>
        <text x="22" y="12" class="section-title">Created <tspan font-weight="700" fill="${titleColor}">${this.data.totalCommits} commits</tspan> in <tspan font-weight="700" fill="${titleColor}">${this.data.totalCommitRepos} repositories</tspan></text>
    </g>

    <!-- Commit Items List -->
    ${commitRowsSvg}

    <!-- 2. Repository Creation Section (if any) -->
    ${
        displayedRepos.length > 0
            ? `
    <g transform="translate(34, ${reposHeaderY})">
        <!-- Repo Icon -->
        <g transform="translate(-10, -3)">
            <circle cx="10" cy="10" r="10" fill="#21262D" />
            <svg x="2" y="2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
        </g>
        <text x="22" y="12" class="section-title">Created <tspan font-weight="700" fill="${titleColor}">${this.data.totalCreatedRepos} repositories</tspan></text>
    </g>

    <!-- Created Repositories Grid -->
    ${reposPillsSvg}
    `
            : ''
    }
</svg>
        `.trim();
    }
}
