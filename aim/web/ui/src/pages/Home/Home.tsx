import React from 'react';
import * as monaco from 'monaco-editor';

// import NotificationContainer from 'components/NotificationContainer/NotificationContainer';
// import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import { IHomeProps } from 'types/pages/home/Home';

// import ExploreAim from './components/ExploreAim/ExploreAim';
// import SetupGuide from './components/SetupGuide/SetupGuide';
// import Activity from './components/Activity/Activity';

import './Home.scss';

function Home({
  activityData,
  onSendEmail,
  notifyData,
  onNotificationDelete,
  askEmailSent,
}: IHomeProps): React.FunctionComponentElement<React.ReactNode> {
  React.useEffect(() => {
    monaco.editor.create(document.getElementById('monaco')!, {
      language: 'newLang',
      quickSuggestions: true,
    });
    function createProposals() {
      return [
        { label: 'Server' },
        { label: 'Request' },
        { label: 'Response' },
        { label: 'Session' },
      ];
    }

    monaco.languages.register({
      id: 'newlang',
    });

    monaco.languages.registerCompletionItemProvider('newlang', {
      provideCompletionItems: function (model: any, position: any) {
        return createProposals();
      } as any,
    });
  }, []);

  return <div id='monaco' style={{ height: 300 }}></div>;
}
export default Home;
