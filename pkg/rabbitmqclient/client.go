package rabbitmqclient

import (
	"fmt"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	stream "github.com/rabbitmq/rabbitmq-stream-go-client/pkg/stream"
)

type Client interface {
	IsConnected() bool
	Connect() (Client, error)
	Reconnect() Client
	Consume(stream.MessagesHandler) (interface{}, error)
	CloseConsumers() error
	Dispose() error
	GetUniqueClientId() string
}

type RabbitMQStreamOptions struct {
	Host                  string             `json:"host"`
	StreamPort            int                `json:"streamPort"`
	AmqpPort              int                `json:"amqpPort"`
	VHost                 string             `json:"vHost"`
	User                  string             `json:"username"`
	Password              string             `json:"password"`
	MaxProducersPerClient int                `json:"maxProducersPerClient"`
	MaxConsumersPerClient int                `json:"maxConsumersPerClient"`
	IsTLS                 bool               `json:"tlsConnection"`
	TLSConfig             bool               `json:"TLSConfig"`
	RequestedHeartbeat    time.Duration      `json:"requestedHeartbeat"`
	RequestedMaxFrameSize int                `json:"requestedMaxFrameSize"`
	WriteBuffer           int                `json:"writeBuffer"`
	ReadBuffer            int                `json:"readBuffer"`
	NoDelay               bool               `json:"noDelay"`
	StreamOptions         *StreamOptions     `json:"streamOptions"`
	ExchangesOptions      []*ExchangeOptions `json:"exchangesOptions"`
	BindingsOptions       []*BindingOptions  `json:"bindingsOptions"`
}

type RabbitMQStreamClient struct {
	RabbitMQOptions *RabbitMQStreamOptions
	Env             *stream.Environment
	Stream          Stream
	Exchanges       []Exchange
	Bindings        []Binding
}

const timeToReconnect time.Duration = 2000 * time.Millisecond

func NewRabbitMQStreamClient() *RabbitMQStreamClient {
	return &RabbitMQStreamClient{}
}

func NewRabbitMQStreamOptions() *RabbitMQStreamOptions {
	return &RabbitMQStreamOptions{}
}

func (client *RabbitMQStreamClient) SetRabbitMQOptions(rabbitmqStreamOptions *RabbitMQStreamOptions) *RabbitMQStreamClient {
	client.RabbitMQOptions = rabbitmqStreamOptions
	return client
}

func (client *RabbitMQStreamClient) SetEnv() (*RabbitMQStreamClient, error) {
	// Connect to the broker
	env, err := stream.NewEnvironment(
		stream.NewEnvironmentOptions().
			SetHost(client.RabbitMQOptions.Host).
			SetPort(client.RabbitMQOptions.StreamPort).
			SetVHost(client.RabbitMQOptions.VHost).
			SetUser(client.RabbitMQOptions.User).
			SetPassword(client.RabbitMQOptions.Password).
			SetMaxProducersPerClient(client.RabbitMQOptions.MaxProducersPerClient).
			SetMaxConsumersPerClient(client.RabbitMQOptions.MaxConsumersPerClient).
			IsTLS(client.RabbitMQOptions.IsTLS).
			//SetTLSConfig(&tls.Config{}).
			SetRequestedHeartbeat(client.RabbitMQOptions.RequestedHeartbeat * time.Second).
			SetRequestedMaxFrameSize(client.RabbitMQOptions.RequestedMaxFrameSize).
			SetWriteBuffer(client.RabbitMQOptions.WriteBuffer).
			SetReadBuffer(client.RabbitMQOptions.ReadBuffer).
			SetNoDelay(client.RabbitMQOptions.NoDelay).
			SetAddressResolver(stream.AddressResolver{
				Host: client.RabbitMQOptions.Host,
				Port: client.RabbitMQOptions.StreamPort,
			},
			),
	)

	client.Env = env

	return client, err
}

func (client *RabbitMQStreamClient) SetStream() *RabbitMQStreamClient {
	client.Stream = client.RabbitMQOptions.StreamOptions
	return client
}

func (client *RabbitMQStreamClient) SetExchanges() *RabbitMQStreamClient {
	for exchangeIndex := 0; exchangeIndex < len(client.RabbitMQOptions.ExchangesOptions); exchangeIndex += 1 {
		client.Exchanges = append(client.Exchanges, client.RabbitMQOptions.ExchangesOptions[exchangeIndex])
	}
	return client
}

func (client *RabbitMQStreamClient) SetBindings() *RabbitMQStreamClient {
	for bindingIndex := 0; bindingIndex < len(client.RabbitMQOptions.BindingsOptions); bindingIndex += 1 {
		client.Bindings = append(client.Bindings, client.RabbitMQOptions.BindingsOptions[bindingIndex])
	}
	return client
}

func (client *RabbitMQStreamClient) CreateStream() (*RabbitMQStreamClient, error) {
	return client, client.Stream.CreateStream(client.Env)
}

func (client *RabbitMQStreamClient) CreateExchanges() (*RabbitMQStreamClient, error) {
	for exchangeIndex := 0; exchangeIndex < len(client.RabbitMQOptions.ExchangesOptions); exchangeIndex += 1 {
		if err := client.Exchanges[exchangeIndex].CreateExchange(client.RabbitMQOptions); err != nil {
			return client, err
		}
	}
	return client, nil
}

func (client *RabbitMQStreamClient) CreateBindings() (*RabbitMQStreamClient, error) {
	for bindingIndex := 0; bindingIndex < len(client.RabbitMQOptions.BindingsOptions); bindingIndex += 1 {
		if err := client.Bindings[bindingIndex].CreateBinding(client.RabbitMQOptions); err != nil {
			return client, err
		}
	}
	return client, nil
}

func (client *RabbitMQStreamClient) IsConnected() bool {
	return !client.Env.IsClosed()
}

func (client *RabbitMQStreamClient) Connect() (Client, error) {
	log.DefaultLogger.Info("Trying set the RabbitMQ environment...")
	_, err := client.SetEnv()
	if err != nil {
		log.DefaultLogger.Error("Couldn't set the RabbitMQ environment: %s", err)
		return client, err
	}
	log.DefaultLogger.Info("Successfully set the RabbitMQ environment!")

	log.DefaultLogger.Info("Trying to set the RabbitMQ objects...")
	client.SetStream()
	client.SetExchanges()
	client.SetBindings()
	log.DefaultLogger.Info("Successfully set the RabbitMQ objects!")

	log.DefaultLogger.Info("Trying to create the RabbitMQ objects...")
	_, err = client.CreateExchanges()
	if err != nil {
		return client, err
	}
	_, err = client.CreateStream()
	if err != nil {
		return client, err
	}
	_, err = client.CreateBindings()
	if err != nil {
		return client, err
	}
	log.DefaultLogger.Info("Successfully created the RabbitMQ objects!")

	log.DefaultLogger.Info("Finished creating the RabbitMQ environment that is connected to the Grafana!")

	return client, nil
}

func (client *RabbitMQStreamClient) CloseConnection() error {
	if err := client.CloseConsumers(); err != nil {
		return err
	}
	if err := client.Env.DeleteStream(client.RabbitMQOptions.StreamOptions.StreamName); err != nil {
		return err
	}
	if err := client.Env.Close(); err != nil {
		return err
	}
	return nil
}

func (client *RabbitMQStreamClient) Reconnect() Client {
	for {
		time.Sleep(timeToReconnect)
		log.DefaultLogger.Info(
			"Trying to reconnect to RabbitMQ Stream: {RabbitMQ Host: %v ; Stream Name: %v}",
			client.RabbitMQOptions.Host,
			client.RabbitMQOptions.StreamOptions.StreamName,
		)
		err := client.CloseConnection()
		if err != nil {
			continue
		}
		_, err = client.Connect()
		if err != nil {
			continue
		}
		break
	}
	return client
}

func (client *RabbitMQStreamClient) Consume(messageHandler stream.MessagesHandler) (interface{}, error) {
	return client.Stream.Consume(client.Env, messageHandler)
}

func (client *RabbitMQStreamClient) CloseConsumers() error {
	return client.Stream.CloseConsumers()
}

func (client *RabbitMQStreamClient) Dispose() error {
	log.DefaultLogger.Info(
		"Disposing RabbitMQ Stream: {RabbitMQ Host: %v ; Stream Name: %v}",
		client.RabbitMQOptions.Host,
		client.RabbitMQOptions.StreamOptions.StreamName,
	)
	return client.CloseConnection()
}

func (client *RabbitMQStreamClient) GetUniqueClientId() string {
	return fmt.Sprintf(
		"%v_%v_%v",
		client.RabbitMQOptions.Host,
		client.RabbitMQOptions.VHost,
		client.RabbitMQOptions.StreamOptions.StreamName,
	)
}