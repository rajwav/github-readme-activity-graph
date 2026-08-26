import { Utilities } from './utils';
import { Request, Response } from 'express';
import { Fetcher } from './fetcher';
import { invalidUserSvg } from './svgs';
import { UserDetails } from './interfaces/interface';
import { ActivityFetcher } from './activityFetcher';
import { ActivityCard } from './activityCard';

export class Handlers {
    public getRoot(_req: Request, res: Response) {
        res.send(`<h1>GitHub Readme Activity Graph 📈</h1>`);
    }

    public async getGraph(req: Request, res: Response) {
        try {
            const utils = new Utilities(req.query);

            const fetcher = new Fetcher(utils.username);
            const queryOptions = utils.queryOptions();
            const fetchCalendarData = await fetcher.fetchContributions(
                utils.queryOptions().days,
                queryOptions.from,
                queryOptions.to,
            );

            const { finalGraph, header } = await utils.buildGraph(fetchCalendarData);
            utils.setHttpHeader(res, header.maxAge);

            res.status(200).send(finalGraph);
        } catch (error) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.set('Content-Type', 'image/svg+xml');
            res.send(invalidUserSvg('Something unexpected happened 💥'));
        }
    }

    public async getActivity(req: Request, res: Response) {
        try {
            const username = (req.query.username as string)?.trim();
            if (!username) {
                res.setHeader('Cache-Control', 'no-store, max-age=0');
                res.set('Content-Type', 'image/svg+xml');
                res.send(invalidUserSvg('Please provide a username parameter 👤'));
                return;
            }

            const fetcher = new ActivityFetcher(username);
            const activityData = await fetcher.fetchActivity();

            res.setHeader('Cache-Control', 'public, max-age=1800');
            res.set('Content-Type', 'image/svg+xml; charset=utf-8');

            if (typeof activityData === 'string') {
                res.send(invalidUserSvg(activityData));
                return;
            }

            const card = new ActivityCard(activityData, req.query);
            res.status(200).send(card.render());
        } catch (error) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.set('Content-Type', 'image/svg+xml');
            res.send(invalidUserSvg('Something unexpected happened 💥'));
        }
    }

    public async getData(req: Request, res: Response) {
        try {
            const utils = new Utilities(req.query);

            const fetcher = new Fetcher(utils.username);
            const fetchCalendarData: UserDetails | string = await fetcher.fetchContributions(
                utils.queryOptions().days,
            );

            if (typeof fetchCalendarData === 'object') {
                res.status(200).send(fetchCalendarData);
            } else {
                res.send(invalidUserSvg(fetchCalendarData));
            }
        } catch (error) {
            res.send(invalidUserSvg('Something unexpected happened 💥'));
        }
    }
}
