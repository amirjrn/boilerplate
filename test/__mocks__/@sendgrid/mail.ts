const mail = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202, body: {} }]),
};
module.exports = mail;
