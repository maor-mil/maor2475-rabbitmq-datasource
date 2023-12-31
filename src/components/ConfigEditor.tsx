import React, { ChangeEvent, useState, useEffect } from 'react';

import { FieldSet, InlineField, InlineSwitch, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import { RabbitMQDataSourceOptions, RabbitMQSecureJsonData, ExchangesOptions, BindingsOptions, StreamOptions } from '../types';
import { ExchangesComponent } from './ExchangesComponent';
import { BindingsComponent } from './BindingsComponent';
import { LABEL_WIDTH, INPUT_WIDTH, SWITCH_WIDTH } from './consts';

interface Props extends DataSourcePluginOptionsEditorProps<RabbitMQDataSourceOptions, RabbitMQSecureJsonData> {}

export const ConfigEditor = (props: Props) => {
  const {
    onOptionsChange,
    options,
    options: { jsonData, secureJsonData, secureJsonFields },
  } = props;

  const DEFAULT_HOST = "localhost";
  const DEFAULT_AMQP_PORT = 5672;
  const DEFAULT_STREAM_PORT = 5552;
  const DEFAULT_VHOST = "/";
  const DEFAULT_TLS_CONNECTION = false;
  const DEFAULT_USERNAME = "guest";
  const DEFAULT_PASSWORD = "guest";
  const DEFAULT_REQUESTED_HEARTBEAT = 60;
  const DEFAULT_REQUESTED_MAX_FRAME_SIZE = 1048576;
  const DEFAULT_WRITE_BUFFER = 8192;
  const DEFAULT_READ_BUFFER = 65536;
  const DEFAULT_NO_DELAY = false;

  const DEFAULT_STREAM_NAME = "";
  const DEFAULT_STREAM_CONSUMER_NAME = "";
  const DEFAULT_OFFSET_FROM_START = true;
  const DEFAULT_STREAM_MAX_AGE = 1_000_000_000 * 60 * 60;
  const DEFAULT_STREAM_MAX_LENGTH_BYTES = 2_000_000_000;
  const DEFAULT_STREAM_MAX_SEGMENT_SIZE_BYTES = 500_000_000;
  const DEFAULT_STREAM_CRC = false;

  const getDefaultValues = (streamOptions: StreamOptions, exchanges: ExchangesOptions, bindings: BindingsOptions): RabbitMQDataSourceOptions => {
    return {
      host: DEFAULT_HOST,
      amqpPort: DEFAULT_AMQP_PORT,
      streamPort: DEFAULT_STREAM_PORT,
      vHost: DEFAULT_VHOST,
      tlsConnection: DEFAULT_TLS_CONNECTION,
      username: DEFAULT_USERNAME,
      streamOptions: streamOptions,
      exchangesOptions: exchanges,
      bindingsOptions: bindings,
      requestedHeartbeat: DEFAULT_REQUESTED_HEARTBEAT,
      requestedMaxFrameSize: DEFAULT_REQUESTED_MAX_FRAME_SIZE,
      writeBuffer: DEFAULT_WRITE_BUFFER,
      readBuffer: DEFAULT_READ_BUFFER,
      noDelay: DEFAULT_NO_DELAY,
    };
  };

  const [streamOptions, setStreamOptions] = useState<StreamOptions>({
    streamName: DEFAULT_STREAM_NAME,
    consumerName: DEFAULT_STREAM_CONSUMER_NAME,
    maxAge: DEFAULT_STREAM_MAX_AGE,
    maxLengthBytes: DEFAULT_STREAM_MAX_LENGTH_BYTES,
    maxSegmentSizeBytes: DEFAULT_STREAM_MAX_SEGMENT_SIZE_BYTES,
    offsetFromStart: DEFAULT_OFFSET_FROM_START,
    crc: DEFAULT_STREAM_CRC
  });
  const [exchangesOptions, setExchanges] = useState<ExchangesOptions>([]);
  const [bindingsOptions, setBindings] = useState<BindingsOptions>([]);

  // Secure field (only sent to the backend)
  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        password: event.target.value,
      },
    });
  };

  const onResetPassword = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        password: '',
      },
    });
  };

  /* eslint-disable react-hooks/exhaustive-deps */

  useEffect(() => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        streamOptions,
      },
    });
  }, [streamOptions]);

  useEffect(() => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        exchangesOptions,
      },
    });
  }, [exchangesOptions]);
  
  useEffect(() => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        bindingsOptions,
      },
    });
  }, [bindingsOptions]);

  useEffect(() => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        ...getDefaultValues(streamOptions, exchangesOptions, bindingsOptions),
      },
    });
  }, []);

  /* eslint-enable react-hooks/exhaustive-deps */

  const onNumericInputChange = (value: string, defaultValue: number, callback: (val: number) => void) => {
    const parsedValue = parseInt(value, 10);
    callback(isNaN(parsedValue) ? defaultValue : parsedValue);
  };

  return (
    <div className="gf-form-group">
      <FieldSet label="Connection">
        <InlineField label="Host" labelWidth={LABEL_WIDTH} tooltip="Hostname (or the IP) of the RabbitMQ server">
          <Input
            onChange={(event) =>
              onOptionsChange({
                ...options,
                jsonData: { ...options.jsonData, host: event.currentTarget.value || DEFAULT_HOST },
              })
            }
            placeholder={jsonData?.host ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="AMQP Port" labelWidth={LABEL_WIDTH} tooltip="The AMQP port of the RabbitMQ server">
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_AMQP_PORT, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, amqpPort: value},
                })
              )
            }
            placeholder={jsonData?.amqpPort?.toString() ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Stream Port" labelWidth={LABEL_WIDTH} tooltip="The stream port of the RabbitMQ server">
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_STREAM_PORT, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, streamPort: value},
                })
              )
            }
            placeholder={jsonData?.streamPort?.toString() ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="VHost" labelWidth={LABEL_WIDTH} tooltip="The virtual host the RabbitMQ server">
          <Input
            onChange={(event) =>
              onOptionsChange({
                ...options,
                jsonData: { ...options.jsonData, vHost: event.currentTarget.value || DEFAULT_VHOST},
              })
            }
            placeholder={jsonData?.vHost?.toString() ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
      </FieldSet>
      <FieldSet label="Authentication">
        <InlineField label="TLS Connection" labelWidth={LABEL_WIDTH} tooltip="Should use TLS to connect to the RabbitMQ server">
          <InlineSwitch
            onChange={(event) =>
              onOptionsChange({
                ...options,
                jsonData: { ...options.jsonData, tlsConnection: event!.currentTarget.checked },
              })
            }
            value={jsonData?.tlsConnection ?? false}
            width={SWITCH_WIDTH}
          />
        </InlineField>
        <InlineField label="Username" labelWidth={LABEL_WIDTH} tooltip="Username to connect to the RabbitMQ server">
          <Input
            onChange={(event) =>
              onOptionsChange({
                ...options,
                jsonData: { ...options.jsonData, username: event.currentTarget.value || DEFAULT_USERNAME},
              })
            }
            placeholder={jsonData?.username ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Password" labelWidth={LABEL_WIDTH} tooltip="Password to connect to the RabbitMQ server">
          <SecretInput
            isConfigured={!!secureJsonFields.password}
            value={secureJsonData?.password ?? DEFAULT_PASSWORD}
            placeholder={DEFAULT_PASSWORD}
            width={INPUT_WIDTH}
            onReset={onResetPassword}
            onChange={onPasswordChange}
          />
        </InlineField>
      </FieldSet>
      <FieldSet label="Stream Settings">
        <InlineField label="Stream Name" labelWidth={LABEL_WIDTH} tooltip="The stream name that will be created">
          <Input
            onChange={(event) =>
              setStreamOptions({
                ...streamOptions,
                streamName: event.currentTarget.value,
              })
            }
            placeholder={streamOptions.streamName}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Consumer Name" labelWidth={LABEL_WIDTH} tooltip="The consumer name that will be created">
          <Input
            onChange={(event) =>
              setStreamOptions({
                ...streamOptions,
                consumerName: event.currentTarget.value,
              })
            }
            placeholder={streamOptions.consumerName}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Offset From Start" labelWidth={LABEL_WIDTH} tooltip="Should the consumer consume messages from the start or the end of the stored messages in the stream">
          <InlineSwitch
            onChange={(event) =>
              setStreamOptions({
                ...streamOptions,
                offsetFromStart: event!.currentTarget.checked,
              })
            }
            value={streamOptions.offsetFromStart}
            width={SWITCH_WIDTH}
          />
        </InlineField>
        <InlineField label="Max Age" labelWidth={LABEL_WIDTH} tooltip="The max age of messages in the stream in nano-seconds (set to 0 to disable the max-age limit)">
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_STREAM_MAX_AGE, (value) =>
                setStreamOptions({
                  ...streamOptions,
                  maxAge: value,
                })
              )
            }
            placeholder={streamOptions.maxAge.toString()}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Max Length Bytes" labelWidth={LABEL_WIDTH} tooltip="The max length of messages in bytes in the stream (set to 0 to disable the max-length-bytes limit)">
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_STREAM_MAX_LENGTH_BYTES, (value) =>
                setStreamOptions({
                  ...streamOptions,
                  maxLengthBytes: value,
                })
              )
            }
            placeholder={streamOptions.maxLengthBytes.toString()}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Max Segment Size Bytes" labelWidth={LABEL_WIDTH} tooltip="The max segment size in bytes in the stream">
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_STREAM_MAX_SEGMENT_SIZE_BYTES, (value) =>
                setStreamOptions({
                  ...streamOptions,
                  maxSegmentSizeBytes: value,
                })
              )
            }
            placeholder={streamOptions.maxSegmentSizeBytes.toString()}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="CRC" labelWidth={LABEL_WIDTH} tooltip="When CRC control is disabled, the perfomance is increased">
          <InlineSwitch
            onChange={(event) =>
              setStreamOptions({
                ...streamOptions,
                crc: event!.currentTarget.checked,
              })
            }
            value={streamOptions.crc}
            width={SWITCH_WIDTH}
          />
        </InlineField>
      </FieldSet>
      <FieldSet label="Exchanges (Create new exchanges in the RabbitMQ)">
        <ExchangesComponent exchanges={exchangesOptions} setExchanges={setExchanges}/>
      </FieldSet>
      <FieldSet label="Bindings (Create new bindings in the RabbitMQ)">
        <BindingsComponent bindings={bindingsOptions} setBindings={setBindings}/>
      </FieldSet>
      <FieldSet label="Advanced RabbitMQ Stream Settings (Change these only if you really know what you are doing)">
        <InlineField label="Requested Heartbeat" labelWidth={LABEL_WIDTH}>
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_REQUESTED_HEARTBEAT, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, requestedHeartbeat: value},
                })
              )
            }
            placeholder={jsonData?.requestedHeartbeat?.toString() ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Requested Max FrameSize" labelWidth={LABEL_WIDTH}>
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_REQUESTED_MAX_FRAME_SIZE, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, requestedMaxFrameSize: value},
                })
              )
            }
            placeholder={jsonData?.requestedMaxFrameSize?.toString() ?? ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Write Buffer" labelWidth={LABEL_WIDTH}>
          <Input
            onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_WRITE_BUFFER, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, writeBuffer: value},
                })
              )
            }
            placeholder={jsonData?.writeBuffer?.toString() || ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="Read Buffer" labelWidth={LABEL_WIDTH}>
          <Input
             onChange={(event) =>
              onNumericInputChange(event.currentTarget.value, DEFAULT_READ_BUFFER, (value) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...options.jsonData, readBuffer: value},
                })
              )
            }
            placeholder={jsonData?.readBuffer?.toString() || ''}
            width={INPUT_WIDTH}
          />
        </InlineField>
        <InlineField label="No Delay" labelWidth={LABEL_WIDTH}>
          <InlineSwitch
            onChange={(event) =>
              onOptionsChange({
                ...options,
                jsonData: { ...options.jsonData, noDelay: event!.currentTarget.checked },
              })
            }
            value={jsonData.noDelay}
            width={SWITCH_WIDTH}
          />
        </InlineField>
      </FieldSet>
    </div>
  );
}
