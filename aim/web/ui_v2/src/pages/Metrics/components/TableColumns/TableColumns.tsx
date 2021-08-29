import React from 'react';
import { Chip } from '@material-ui/core';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';

import { ITableColumn } from 'types/pages/metrics/components/TableColumns/TableColumns';
import {
  AggregationAreaMethods,
  AggregationLineMethods,
} from 'utils/aggregateGroupData';

function getTableColumns({
  paramColumns,
  groupFields,
  aggregationMethods,
}: any): ITableColumn[] {
  const columns = [
    {
      dataKey: 'experiment',
      key: 'experiment',
      title: 'Experiment',
      width: 150,
      minWidth: 90,
      resizable: true,
      frozen: 'left',
    },
    {
      dataKey: 'run',
      key: 'run',
      title: 'Run',
      width: 150,
      minWidth: 90,
      resizable: true,
    },
    {
      dataKey: 'metric',
      key: 'metric',
      title: 'Metric',
      width: 150,
      minWidth: 90,
      resizable: true,
    },
    {
      dataKey: 'context',
      key: 'context',
      title: 'Context',
      cellRenderer: ({ cellData, rowData }: any) =>
        rowData.groupHeader
          ? cellData
          : (cellData as string[]).map((c, i) => (
              <Chip
                key={i}
                variant='outlined'
                color='primary'
                label={c}
                size='small'
              />
            )),
      width: 150,
      minWidth: 90,
      resizable: true,
    },
    {
      dataKey: 'value',
      key: 'value',
      title: 'Value',
      width: 150,
      minWidth: 90,
      resizable: true,
    },
    {
      dataKey: 'step',
      key: 'step',
      title: 'Step',
      width: 150,
      minWidth: 90,
    },
    {
      dataKey: 'epoch',
      key: 'epoch',
      title: 'Epoch',
      width: 150,
      minWidth: 90,
    },
    {
      dataKey: 'timestamp',
      key: 'timestamp',
      title: 'Time',
      width: 150,
      minWidth: 90,
      resizable: true,
    },
    {
      dataKey: 'actions',
      key: 'actions',
      title: '',
      width: 50,
      frozen: 'right',
      align: 'center',
      cellRenderer: function ActionCell({ rowData }: any) {
        return rowData.groupHeader ? null : (
          <VisibilityOutlinedIcon color='primary' fontSize='small' />
        );
      },
    },
  ].concat(
    paramColumns.map((param: string) => ({
      dataKey: param,
      key: param,
      title: param,
      cellRenderer: ({ rowData }: any) =>
        typeof rowData[param] === 'object'
          ? JSON.stringify(rowData[param])
          : rowData[param],
      width: 150,
      minWidth: 90,
      resizable: true,
    })),
  );

  if (groupFields) {
    Object.keys(groupFields).forEach((field) => {
      const key = field.replace('run.params.', '');
      const column = columns.find((col) => col.key === key);
      if (!!column) {
        column.frozen = 'left';
      }
    });
    columns.sort((a, b) => {
      if (a.key === '#') {
        return -1;
      } else if (
        groupFields.hasOwnProperty(a.key) ||
        groupFields.hasOwnProperty(`run.params.${a.key}`)
      ) {
        return -1;
      }
      return 0;
    });
  }

  return !!groupFields
    ? [
        {
          dataKey: '#',
          key: '#',
          title: '#',
          width: 100,
          frozen: 'left',
        } as ITableColumn,
      ].concat(columns)
    : columns;
}

export default getTableColumns;
