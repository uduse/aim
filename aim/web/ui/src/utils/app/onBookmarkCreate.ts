import * as analytics from 'services/analytics';

import { BookmarkNotificationsEnum } from 'config/notification-messages/notificationMessages';
import appsService from 'services/api/apps/appsService';
import dashboardService from 'services/api/dashboard/dashboardService';
import {
  IAppData,
  IDashboardData,
} from 'types/services/models/metrics/metricsAppModel';
import onNotificationAdd from './onNotificationAdd';
import { IModel, State } from 'types/services/models/model';

export default async function onBookmarkCreate<M extends State>(
  { name, description }: any,
  model: IModel<M>,
  appName: string,
): Promise<void> {
  const configData = model?.getState()?.config;
  if (configData) {
    const app: IAppData | any = await appsService
      .createApp({ state: configData, type: appName.toLowerCase() })
      .call();
    if (app.id) {
      const bookmark: IDashboardData = await dashboardService
        .createDashboard({ app_id: app.id, name, description })
        .call();
      if (bookmark.name) {
        onNotificationAdd(
          {
            id: Date.now(),
            severity: 'success',
            message: BookmarkNotificationsEnum.CREATE,
          },
          model,
        );
      } else {
        onNotificationAdd(
          {
            id: Date.now(),
            severity: 'error',
            message: BookmarkNotificationsEnum.ERROR,
          },
          model,
        );
      }
    }
  }
  analytics.trackEvent(`[${appName}Explorer] Create bookmark`);
}