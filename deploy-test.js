const Election = artifacts.require("Election");

module.exports = async function () {
  const instance = await Election.new();
  console.log("New test election deployed at:", instance.address);
};