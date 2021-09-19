import * as React from 'react';
import {
  Box,
  Divider,
  Link,
  Paper,
  Typography,
  capitalize,
} from '@material-ui/core';

import TagLabel from 'components/TagLabel/TagLabel';
import { ITagInfo } from 'types/pages/tags/Tags';
import Icon from 'components/Icon/Icon';
import Button from 'components/Button/Button';

function RunTags({ attachedTags, tags }: any) {
  return (
    <Box>
      <Divider className='PopoverContent__divider' />
      <Box
        paddingX={1}
        paddingY={0.625}
        display='flex'
        alignItems='center'
        justifyContent='space-between'
      >
        {attachedTags?.length > 0 ? (
          <>
            <Box>
              {attachedTags.map((tag: ITagInfo) => (
                <TagLabel key={tag.name} label={tag.name} color={tag.color} />
              ))}
            </Box>
            <div>
              <Icon name='edit' />
            </div>
          </>
        ) : (
          <>
            No attached tags
            <Button variant='outlined' color='primary' size='small'>
              <Icon name='plus' style={{ marginRight: '0.5rem' }} />
              Attach
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

export default RunTags;
