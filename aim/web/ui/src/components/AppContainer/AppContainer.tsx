import React from 'react';

import { IAppContainerProps } from './types';

import './styles.scss';

/**
 * AppContainer
 * Useful for a single Application to wrap the content
 */
const AppContainer = React.forwardRef(
  (props: IAppContainerProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    return (
      <main ref={ref} className='AppContainer'>
        <div className='AppContentWrapper'>
          <div className='AppContent full_height flex fdc'>
            {props.children}
          </div>
        </div>
      </main>
    );
  },
);

AppContainer.displayName = 'AppContainer';

export default React.memo<IAppContainerProps>(AppContainer);
