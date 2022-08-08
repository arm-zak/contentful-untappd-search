import React, {useEffect, useState} from 'react';
import {IconButton, TextInput} from '@contentful/f36-components';
import {SidebarExtensionSDK} from '@contentful/app-sdk';
import { useCMA,  useSDK} from '@contentful/react-apps-toolkit';
import {SearchIcon} from "@contentful/f36-icons";
import countries from "i18n-iso-countries";

const Sidebar = () => {
    const sdk = useSDK<SidebarExtensionSDK>();
    const cma = useCMA();
    const [value, setValue] = useState("");
    const clientId = sdk.parameters.instance['untappdId'];
    const clientSecret = sdk.parameters.instance['untappdSecret'];
    async function searchUntappd() {
        const searchResponse = await fetch("https://api.untappd.com/v4/search/beer?client_id=" +
            clientId +
            "&client_secret=" +
            clientSecret +
            "&limit=10&q=" +
            value
        );
        setValue("")
        const searchResults = await searchResponse.json()
        const selectedItem = await sdk.dialogs.openCurrent({
            width: 500,
            minHeight: "25vh",
            title: "Select item",
            shouldCloseOnEscapePress: true,
            shouldCloseOnOverlayClick: true,
            parameters: {beers: searchResults.response.beers},
        })
        fillDetails(selectedItem)
    }

    function getCountryCode(country : string) {
        switch (country) {
            case "England":
                return "GB-ENG"
            case 'Scotland':
                return 'GB-SCT'
            case 'Northern Ireland':
                return 'GB-NIR'
            case 'Wales':
                return "GB-WLS"
            default:
                return countries.getAlpha2Code(country, "en")
        }
    }
    async function fillDetails(selectedItem: any) {
        const itemResponse = await fetch("https://api.untappd.com/v4/beer/info/" +
            selectedItem.beer.bid +
            "?client_id=" +
            clientId +
            "&client_secret=" +
            clientSecret +
            "&compact=true"
        );
        const item = await itemResponse.json()
        const imageId = await publishImage(item.response.beer.beer_label_hd, item.response.beer.beer_name)
        sdk.entry.fields.title.setValue(item.response.beer.beer_name);
        sdk.entry.fields.alcoholRate.setValue(item.response.beer.beer_abv);
        sdk.entry.fields.type.setValue(item.response.beer.beer_style);
        sdk.entry.fields.producer.setValue(item.response.beer.brewery.brewery_name);
        sdk.entry.fields.description.setValue(item.response.beer.beer_description);
        sdk.entry.fields.countryOrigin.setValue(getCountryCode(item.response.beer.brewery.country_name));
        sdk.entry.fields.image.setValue({sys:{
                "type": "Link",
                "linkType": "Asset",
                "id": imageId
            }})

    }

    async function publishImage(imageUrl : string, beerName : string) : Promise<string> {
        if (imageUrl.length === 0 || imageUrl.split('/') === undefined || imageUrl.split('/').pop() === undefined){
            return ""
        }
        const imageName = imageUrl.split('/').pop()
        try {
            await cma.tag.get({tagId:"untappd"})
        } catch (e) {
            await cma.tag.createWithId({tagId: "untappd"},{sys: {visibility:"private"}, name: "untappd"})
        }
        let asset = await cma.asset.create({}, {
            fields: {
                title: {
                    'en-US': beerName
                },
                description: {
                    'en-US': ''
                },
                file: {
                    'en-US': {
                        contentType: 'image/jpeg',
                        fileName: imageName !== undefined ? imageName : "",
                        upload: imageUrl
                    }
                }
            },
            metadata: {
                tags: [{sys: {
                        type: "Link",
                        linkType: "Tag",
                        id: "untappd"
                    }}]
            }
        })
        asset = await cma.asset.processForAllLocales({},asset)
        asset = await cma.asset.publish({assetId:asset.sys.id},asset)

        return asset.sys.id
    }

    async function handleKeyPress(event: any) {
        if (event.key === 'Enter') {
            searchUntappd()
        }
    }

    useEffect(() => {
        sdk.window.updateHeight()
        countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
    }, [sdk.window]);

    return <TextInput.Group>
        <TextInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={"Search for an Untappd item"}

        />
        <IconButton
            variant="secondary"
            icon={<SearchIcon/>}
            onClick={searchUntappd}
            aria-label="Unlock"
        />
    </TextInput.Group>;
};

export default Sidebar;
